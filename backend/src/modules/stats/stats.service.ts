import type { PipelineStage, Types } from 'mongoose';
import { PATIENT_CONDITIONS, type PatientCondition } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { TtlCache } from '../../lib/cache.js';
import { Doctor } from '../doctors/doctor.model.js';
import { Patient } from '../patients/patient.model.js';

export const STATS_RANGES = ['7d', '30d', '90d'] as const;
export type StatsRange = (typeof STATS_RANGES)[number];
const RANGE_DAYS: Record<StatsRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

const DAY_MS = 24 * 60 * 60 * 1000;

export interface Overview {
  range: StatsRange;
  generatedAt: string;
  totals: {
    doctors: number;
    patients: number;
    critical: number;
    avgPatientsPerDoctor: number;
  };
  period: {
    admissions: Comparison;
    newDoctors: Comparison;
  };
  admissionsTrend: Array<{ bucket: string; admissions: number; critical: number }>;
  patientsByCondition: Array<{ condition: PatientCondition; count: number }>;
  topDoctors: Array<{ id: string; name: string; specialization: string; hospital: string; patients: number }>;
}

interface Comparison {
  current: number;
  previous: number;
  /** Percentage change vs. the previous period of equal length; null when previous is 0. */
  changePct: number | null;
}

// ---------------------------------------------------------------------------------------------
// Date helpers (all buckets are computed in UTC, matching $dateTrunc below)
// ---------------------------------------------------------------------------------------------

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Daily buckets: the last N days including today (UTC). */
function resolveRange(range: StatsRange, now: Date): Date {
  return startOfUtcDay(new Date(now.getTime() - (RANGE_DAYS[range] - 1) * DAY_MS));
}

function compare(current: number, previous: number): Comparison {
  return {
    current,
    previous,
    changePct: previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10,
  };
}

// ---------------------------------------------------------------------------------------------
// Queries. Each one is a single round trip; all of them run in parallel.
// ---------------------------------------------------------------------------------------------

/** Admissions per bucket for the selected period, plus the previous period's total. */
export function admissionsPipeline(start: Date, previousStart: Date, now: Date): PipelineStage[] {
  return [
    // Bounded by the { admissionDate: -1 } index; only two periods' worth of documents are read.
    { $match: { admissionDate: { $gte: previousStart, $lte: now } } },
    {
      $facet: {
        trend: [
          { $match: { admissionDate: { $gte: start } } },
          {
            $group: {
              _id: {
                $dateTrunc: { date: '$admissionDate', unit: 'day', timezone: 'UTC' },
              },
              admissions: { $sum: 1 },
              critical: { $sum: { $cond: [{ $eq: ['$condition', 'critical'] }, 1, 0] } },
            },
          },
        ],
        previous: [{ $match: { admissionDate: { $lt: start } } }, { $count: 'count' }],
      },
    },
  ];
}

async function admissionsInPeriod(start: Date, previousStart: Date, now: Date) {
  const [result] = await Patient.aggregate<{
    trend: Array<{ _id: Date; admissions: number; critical: number }>;
    previous: Array<{ count: number }>;
  }>(admissionsPipeline(start, previousStart, now));

  return {
    trend: result?.trend ?? [],
    previousTotal: result?.previous[0]?.count ?? 0,
  };
}

/**
 * Patients per condition. Sorting on `condition` first lets MongoDB answer this from the
 * { condition, admissionDate, _id } index alone (covered scan, no documents read).
 */
export function conditionCountsPipeline(): PipelineStage[] {
  return [{ $sort: { condition: 1 } }, { $group: { _id: '$condition', count: { $sum: 1 } } }];
}

/** Top 10 doctors by patient count, counted from the { doctor, ... } index alone. */
export function patientsPerDoctorPipeline(): PipelineStage[] {
  return [
    { $sort: { doctor: 1 } },
    { $group: { _id: '$doctor', patients: { $sum: 1 } } },
    { $sort: { patients: -1, _id: 1 } },
    { $limit: 10 },
    // Join after $limit, so only 10 doctor lookups happen.
    {
      $lookup: {
        from: 'doctors',
        localField: '_id',
        foreignField: '_id',
        as: 'doctor',
        pipeline: [{ $project: { name: 1, specialization: 1, hospital: 1 } }],
      },
    },
    { $unwind: '$doctor' },
  ];
}

async function patientDistributions() {
  const [byCondition, topDoctors] = await Promise.all([
    Patient.aggregate<{ _id: PatientCondition; count: number }>(conditionCountsPipeline()),
    Patient.aggregate<{
      _id: Types.ObjectId;
      patients: number;
      doctor: { name: string; specialization: string; hospital: string };
    }>(patientsPerDoctorPipeline()),
  ]);
  return { byCondition, topDoctors };
}

/** Doctors who joined in the current and the previous period (index counts on createdAt). */
export function joinedFilters(start: Date, previousStart: Date) {
  return {
    current: { createdAt: { $gte: start } },
    previous: { createdAt: { $gte: previousStart, $lt: start } },
  };
}

async function doctorCounts(start: Date, previousStart: Date) {
  const joined = joinedFilters(start, previousStart);
  const [total, current, previous] = await Promise.all([
    // Collection metadata: O(1), exact under normal operation.
    Doctor.estimatedDocumentCount(),
    Doctor.countDocuments(joined.current),
    Doctor.countDocuments(joined.previous),
  ]);
  return { total, joined: { current, previous } };
}

// ---------------------------------------------------------------------------------------------

/** The selected period and the previous period of equal length. */
export function resolvePeriod(range: StatsRange, now = new Date()) {
  const start = resolveRange(range, now);
  const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()));
  return { start, previousStart, now };
}

async function computeOverview(range: StatsRange): Promise<Overview> {
  const { start, previousStart, now } = resolvePeriod(range);

  const [admissions, patients, doctors] = await Promise.all([
    admissionsInPeriod(start, previousStart, now),
    patientDistributions(),
    doctorCounts(start, previousStart),
  ]);

  // Zero-fill so charts get a continuous axis.
  const trendByBucket = new Map(admissions.trend.map((row) => [row._id.getTime(), row]));
  const admissionsTrend: Overview['admissionsTrend'] = [];
  for (let bucket = start; bucket <= now; bucket = new Date(bucket.getTime() + DAY_MS)) {
    const row = trendByBucket.get(bucket.getTime());
    admissionsTrend.push({
      bucket: bucket.toISOString(),
      admissions: row?.admissions ?? 0,
      critical: row?.critical ?? 0,
    });
  }
  const currentAdmissions = admissionsTrend.reduce((sum, row) => sum + row.admissions, 0);

  const conditionCounts = new Map(patients.byCondition.map((r) => [r._id, r.count]));
  const patientsByCondition = PATIENT_CONDITIONS.map((condition) => ({
    condition,
    count: conditionCounts.get(condition) ?? 0,
  }));

  const totalPatients = patientsByCondition.reduce((sum, row) => sum + row.count, 0);
  const totalDoctors = doctors.total;
  const { joined } = doctors;

  return {
    range,
    generatedAt: now.toISOString(),
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      critical: conditionCounts.get('critical') ?? 0,
      avgPatientsPerDoctor: totalDoctors ? Math.round((totalPatients / totalDoctors) * 10) / 10 : 0,
    },
    period: {
      admissions: compare(currentAdmissions, admissions.previousTotal),
      newDoctors: compare(joined.current, joined.previous),
    },
    admissionsTrend,
    patientsByCondition,
    topDoctors: patients.topDoctors.map((row) => ({
      id: String(row._id),
      name: row.doctor.name,
      specialization: row.doctor.specialization,
      hospital: row.doctor.hospital,
      patients: row.patients,
    })),
  };
}

const overviewCache = new TtlCache<Overview>(env.STATS_CACHE_TTL_SECONDS * 1000);

export function getOverview(range: StatsRange): Promise<Overview> {
  return overviewCache.getOrSet(range, () => computeOverview(range));
}

/** Called after every write so the dashboard never shows stale numbers after a change. */
export function invalidateStats(): void {
  overviewCache.clear();
}
