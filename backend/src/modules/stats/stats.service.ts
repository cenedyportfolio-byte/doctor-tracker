import type { PipelineStage, Types } from 'mongoose';
import {
  GENDERS,
  PATIENT_CONDITIONS,
  SPECIALIZATIONS,
  type Gender,
  type PatientCondition,
} from '../../config/constants.js';
import { env } from '../../config/env.js';
import { TtlCache } from '../../lib/cache.js';
import { Doctor } from '../doctors/doctor.model.js';
import { Patient } from '../patients/patient.model.js';

export const STATS_RANGES = ['30d', '90d', '6m', '12m'] as const;
export type StatsRange = (typeof STATS_RANGES)[number];
type Granularity = 'day' | 'week' | 'month';

const AGE_BOUNDARIES = [0, 18, 30, 45, 60, 75, 121];
const AGE_LABELS = ['0–17', '18–29', '30–44', '45–59', '60–74', '75+'];
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Overview {
  range: StatsRange;
  granularity: Granularity;
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
  patientsByGender: Array<{ gender: Gender; count: number }>;
  ageGroups: Array<{ label: string; count: number }>;
  topDoctors: Array<{ id: string; name: string; specialization: string; hospital: string; patients: number; critical: number }>;
  specializations: Array<{ specialization: string; doctors: number; patients: number }>;
  recentPatients: Array<{
    id: string;
    name: string;
    condition: string;
    diagnosis: string;
    admissionDate: Date;
    doctor: { id: string; name: string } | null;
  }>;
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

function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const offset = (day.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(day.getTime() - offset * DAY_MS);
}

function addBucket(date: Date, unit: Granularity): Date {
  if (unit === 'day') return new Date(date.getTime() + DAY_MS);
  if (unit === 'week') return new Date(date.getTime() + 7 * DAY_MS);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function resolveRange(range: StatsRange, now: Date) {
  switch (range) {
    case '30d':
      return { unit: 'day' as const, start: startOfUtcDay(new Date(now.getTime() - 29 * DAY_MS)) };
    case '90d':
      return { unit: 'week' as const, start: startOfUtcWeek(new Date(now.getTime() - 89 * DAY_MS)) };
    case '6m':
      return { unit: 'month' as const, start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)) };
    case '12m':
      return { unit: 'month' as const, start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)) };
  }
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
export function admissionsPipeline(unit: Granularity, start: Date, previousStart: Date, now: Date): PipelineStage[] {
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
                $dateTrunc: { date: '$admissionDate', unit, timezone: 'UTC', startOfWeek: 'monday' },
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

async function admissionsInPeriod(unit: Granularity, start: Date, previousStart: Date, now: Date) {
  const [result] = await Patient.aggregate<{
    trend: Array<{ _id: Date; admissions: number; critical: number }>;
    previous: Array<{ count: number }>;
  }>(admissionsPipeline(unit, start, previousStart, now));

  return {
    trend: result?.trend ?? [],
    previousTotal: result?.previous[0]?.count ?? 0,
  };
}

/** Whole-population breakdowns computed in a single collection pass via $facet. */
export function patientBreakdownPipeline(): PipelineStage[] {
  return [
    {
      $facet: {
        byCondition: [{ $group: { _id: '$condition', count: { $sum: 1 } } }],
        byGender: [{ $group: { _id: '$gender', count: { $sum: 1 } } }],
        byAge: [
          {
            $bucket: {
              groupBy: '$age',
              boundaries: AGE_BOUNDARIES,
              default: 'unknown',
              output: { count: { $sum: 1 } },
            },
          },
        ],
        topDoctors: [
          {
            $group: {
              _id: '$doctor',
              patients: { $sum: 1 },
              critical: { $sum: { $cond: [{ $eq: ['$condition', 'critical'] }, 1, 0] } },
            },
          },
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
        ],
        bySpecialization: [
          { $group: { _id: '$doctor', patients: { $sum: 1 } } },
          {
            $lookup: {
              from: 'doctors',
              localField: '_id',
              foreignField: '_id',
              as: 'doctor',
              pipeline: [{ $project: { specialization: 1 } }],
            },
          },
          { $unwind: '$doctor' },
          { $group: { _id: '$doctor.specialization', patients: { $sum: '$patients' } } },
        ],
      },
    },
  ];
}

async function patientDistributions() {
  const [result] = await Patient.aggregate<{
    byCondition: Array<{ _id: PatientCondition; count: number }>;
    byGender: Array<{ _id: Gender; count: number }>;
    byAge: Array<{ _id: number | 'unknown'; count: number }>;
    topDoctors: Array<{
      _id: Types.ObjectId;
      patients: number;
      critical: number;
      doctor: { name: string; specialization: string; hospital: string };
    }>;
    bySpecialization: Array<{ _id: string; patients: number }>;
  }>(patientBreakdownPipeline());
  return result;
}

/** Doctors per specialization plus new-doctor counts for the current and previous period. */
export function doctorBreakdownPipeline(start: Date, previousStart: Date): PipelineStage[] {
  return [
    {
      $facet: {
        bySpecialization: [{ $group: { _id: '$specialization', doctors: { $sum: 1 } } }],
        joined: [
          { $match: { createdAt: { $gte: previousStart } } },
          {
            $group: {
              _id: null,
              current: { $sum: { $cond: [{ $gte: ['$createdAt', start] }, 1, 0] } },
              previous: { $sum: { $cond: [{ $lt: ['$createdAt', start] }, 1, 0] } },
            },
          },
        ],
      },
    },
  ];
}

async function doctorDistributions(start: Date, previousStart: Date) {
  const [result] = await Doctor.aggregate<{
    bySpecialization: Array<{ _id: string; doctors: number }>;
    joined: Array<{ current: number; previous: number }>;
  }>(doctorBreakdownPipeline(start, previousStart));
  return result;
}

export function recentAdmissionsQuery() {
  return Patient.find()
    .sort({ admissionDate: -1, _id: -1 })
    .limit(5)
    .select('name condition diagnosis admissionDate doctor')
    .populate<{ doctor: { _id: Types.ObjectId; name: string } | null }>('doctor', 'name')
    .lean();
}

async function recentAdmissions() {
  const patients = await recentAdmissionsQuery();

  return patients.map((p) => ({
    id: String(p._id),
    name: p.name,
    condition: p.condition,
    diagnosis: p.diagnosis,
    admissionDate: p.admissionDate,
    doctor: p.doctor ? { id: String(p.doctor._id), name: p.doctor.name } : null,
  }));
}

// ---------------------------------------------------------------------------------------------

/** The selected period and the previous period of equal length. */
export function resolvePeriod(range: StatsRange, now = new Date()) {
  const { unit, start } = resolveRange(range, now);
  const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()));
  return { unit, start, previousStart, now };
}

async function computeOverview(range: StatsRange): Promise<Overview> {
  const { unit, start, previousStart, now } = resolvePeriod(range);

  const [admissions, patients, doctors, recentPatients] = await Promise.all([
    admissionsInPeriod(unit, start, previousStart, now),
    patientDistributions(),
    doctorDistributions(start, previousStart),
    recentAdmissions(),
  ]);

  // Zero-fill so charts get a continuous axis.
  const trendByBucket = new Map(admissions.trend.map((row) => [row._id.getTime(), row]));
  const admissionsTrend: Overview['admissionsTrend'] = [];
  for (let bucket = start; bucket <= now; bucket = addBucket(bucket, unit)) {
    const row = trendByBucket.get(bucket.getTime());
    admissionsTrend.push({
      bucket: bucket.toISOString(),
      admissions: row?.admissions ?? 0,
      critical: row?.critical ?? 0,
    });
  }
  const currentAdmissions = admissionsTrend.reduce((sum, row) => sum + row.admissions, 0);

  const conditionCounts = new Map(patients?.byCondition.map((r) => [r._id, r.count]));
  const patientsByCondition = PATIENT_CONDITIONS.map((condition) => ({
    condition,
    count: conditionCounts.get(condition) ?? 0,
  }));

  const genderCounts = new Map(patients?.byGender.map((r) => [r._id, r.count]));
  const patientsByGender = GENDERS.map((gender) => ({ gender, count: genderCounts.get(gender) ?? 0 }));

  const ageCounts = new Map(patients?.byAge.map((r) => [r._id, r.count]));
  const ageGroups = AGE_LABELS.map((label, i) => ({
    label,
    count: ageCounts.get(AGE_BOUNDARIES[i] as number) ?? 0,
  }));

  const doctorsBySpec = new Map(doctors?.bySpecialization.map((r) => [r._id, r.doctors]));
  const patientsBySpec = new Map(patients?.bySpecialization.map((r) => [r._id, r.patients]));
  const specializations = SPECIALIZATIONS.map((specialization) => ({
    specialization,
    doctors: doctorsBySpec.get(specialization) ?? 0,
    patients: patientsBySpec.get(specialization) ?? 0,
  }))
    .filter((row) => row.doctors > 0 || row.patients > 0)
    .sort((a, b) => b.patients - a.patients);

  const totalPatients = patientsByCondition.reduce((sum, row) => sum + row.count, 0);
  const totalDoctors = specializations.reduce((sum, row) => sum + row.doctors, 0);
  const joined = doctors?.joined[0];

  return {
    range,
    granularity: unit,
    generatedAt: now.toISOString(),
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      critical: conditionCounts.get('critical') ?? 0,
      avgPatientsPerDoctor: totalDoctors ? Math.round((totalPatients / totalDoctors) * 10) / 10 : 0,
    },
    period: {
      admissions: compare(currentAdmissions, admissions.previousTotal),
      newDoctors: compare(joined?.current ?? 0, joined?.previous ?? 0),
    },
    admissionsTrend,
    patientsByCondition,
    patientsByGender,
    ageGroups,
    topDoctors: (patients?.topDoctors ?? []).map((row) => ({
      id: String(row._id),
      name: row.doctor.name,
      specialization: row.doctor.specialization,
      hospital: row.doctor.hospital,
      patients: row.patients,
      critical: row.critical,
    })),
    specializations,
    recentPatients,
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
