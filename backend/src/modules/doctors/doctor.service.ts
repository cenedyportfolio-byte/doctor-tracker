import type { QueryFilter, SortOrder } from 'mongoose';
import { PATIENT_CONDITIONS, SPECIALIZATIONS, type PatientCondition } from '../../config/constants.js';
import { ApiError } from '../../lib/api-error.js';
import { buildPageMeta, skipFor, type Paginated } from '../../lib/pagination.js';
import { buildSearchFilter } from '../../lib/search.js';
import { Patient } from '../patients/patient.model.js';
import { countPatientsByDoctor } from '../patients/patient.service.js';
import { invalidateStats } from '../stats/stats.service.js';
import { Doctor, type DoctorDoc } from './doctor.model.js';
import type {
  CreateDoctorInput,
  DoctorOptionsQuery,
  ListDoctorsQuery,
  UpdateDoctorInput,
} from './doctor.schema.js';

export interface DoctorDTO {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorDetailDTO extends DoctorDTO {
  patientsByCondition: Record<PatientCondition, number>;
  lastAdmissionAt: Date | null;
}

type DoctorRecord = Omit<DoctorDoc, 'searchKeywords'>;

// `_id` is the tie-breaker so pages are stable when sort keys collide. Each sort matches an
// index (traversed forwards or backwards), so MongoDB never sorts in memory.
const SORTS: Record<ListDoctorsQuery['sort'], Record<string, SortOrder>> = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name_asc: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: -1 },
};

function toDoctorDTO(doctor: DoctorRecord, patientCount = 0): DoctorDTO {
  return {
    id: String(doctor._id),
    name: doctor.name,
    specialization: doctor.specialization,
    hospital: doctor.hospital,
    phone: doctor.phone,
    email: doctor.email,
    patientCount,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt,
  };
}

function buildDoctorFilter(query: ListDoctorsQuery): QueryFilter<DoctorDoc> {
  const filter: QueryFilter<DoctorDoc> = { ...buildSearchFilter(query.search) };

  if (query.specialization) filter.specialization = { $in: query.specialization };
  if (query.hospital) filter.hospital = query.hospital;
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from && { $gte: query.from }),
      ...(query.to && { $lte: query.to }),
    };
  }
  return filter;
}

export async function listDoctors(query: ListDoctorsQuery): Promise<Paginated<DoctorDTO>> {
  const filter = buildDoctorFilter(query);
  const hasFilter = Object.keys(filter).length > 0;

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .sort(SORTS[query.sort])
      .skip(skipFor(query.page, query.limit))
      .limit(query.limit)
      .lean<DoctorRecord[]>(),
    // Unfiltered totals come from collection metadata instead of counting every document.
    hasFilter ? Doctor.countDocuments(filter) : Doctor.estimatedDocumentCount(),
  ]);

  // Patient counts only for the doctors on this page: one index-backed $group, bounded by `limit`.
  const counts = await countPatientsByDoctor(doctors.map((d) => d._id));

  return {
    data: doctors.map((d) => toDoctorDTO(d, counts.get(String(d._id)) ?? 0)),
    meta: buildPageMeta(query.page, query.limit, total),
  };
}

export async function getDoctorFacets() {
  // distinct() on an indexed field is answered from the index (DISTINCT_SCAN).
  const hospitals = await Doctor.distinct('hospital');
  return {
    specializations: [...SPECIALIZATIONS],
    hospitals: hospitals.sort((a, b) => a.localeCompare(b)),
  };
}

/** Lightweight id/name list for pickers. Searchable so it scales past a few hundred doctors. */
export async function listDoctorOptions(query: DoctorOptionsQuery) {
  const doctors = await Doctor.find({ ...buildSearchFilter(query.search) })
    .select('name specialization hospital')
    .sort({ name: 1, _id: 1 })
    .limit(query.limit)
    .lean();

  return doctors.map((d) => ({
    id: String(d._id),
    name: d.name,
    specialization: d.specialization,
    hospital: d.hospital,
  }));
}

export async function getDoctor(id: string): Promise<DoctorDetailDTO> {
  const doctor = await Doctor.findById(id).lean<DoctorRecord>();
  if (!doctor) throw ApiError.notFound('Doctor');

  const [summary] = await Patient.aggregate<{
    byCondition: Array<{ _id: PatientCondition; count: number }>;
    last: Array<{ admissionDate: Date }>;
  }>([
    { $match: { doctor: doctor._id } },
    {
      $facet: {
        byCondition: [{ $group: { _id: '$condition', count: { $sum: 1 } } }],
        last: [{ $sort: { admissionDate: -1 } }, { $limit: 1 }, { $project: { admissionDate: 1 } }],
      },
    },
  ]);

  const patientsByCondition = Object.fromEntries(PATIENT_CONDITIONS.map((c) => [c, 0])) as Record<
    PatientCondition,
    number
  >;
  let patientCount = 0;
  for (const row of summary?.byCondition ?? []) {
    patientsByCondition[row._id] = row.count;
    patientCount += row.count;
  }

  return {
    ...toDoctorDTO(doctor, patientCount),
    patientsByCondition,
    lastAdmissionAt: summary?.last[0]?.admissionDate ?? null,
  };
}

export async function createDoctor(input: CreateDoctorInput): Promise<DoctorDTO> {
  const doctor = await Doctor.create(input);
  invalidateStats();
  return toDoctorDTO(doctor.toObject());
}

export async function updateDoctor(id: string, input: UpdateDoctorInput): Promise<DoctorDTO> {
  const doctor = await Doctor.findById(id);
  if (!doctor) throw ApiError.notFound('Doctor');

  doctor.set(input);
  await doctor.save(); // runs the hook that rebuilds search keywords
  invalidateStats();

  const counts = await countPatientsByDoctor([doctor._id]);
  return toDoctorDTO(doctor.toObject(), counts.get(String(doctor._id)) ?? 0);
}

export async function deleteDoctor(id: string): Promise<void> {
  const doctor = await Doctor.exists({ _id: id });
  if (!doctor) throw ApiError.notFound('Doctor');

  const patientCount = await Patient.countDocuments({ doctor: doctor._id });
  if (patientCount > 0) {
    throw ApiError.conflict(
      `This doctor still has ${patientCount} patient${patientCount === 1 ? '' : 's'}. Reassign or remove them first.`,
    );
  }

  await Doctor.deleteOne({ _id: doctor._id });
  invalidateStats();
}
