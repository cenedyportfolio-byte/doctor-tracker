import { Types, type QueryFilter, type SortOrder } from 'mongoose';
import { ApiError } from '../../lib/api-error.js';
import { buildPageMeta, skipFor, type Paginated } from '../../lib/pagination.js';
import { buildSearchFilter } from '../../lib/search.js';
import { Doctor } from '../doctors/doctor.model.js';
import { invalidateStats } from '../stats/stats.service.js';
import { Patient, type PatientDoc } from './patient.model.js';
import type { CreatePatientInput, ListPatientsQuery, UpdatePatientInput } from './patient.schema.js';

export interface PatientDTO {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string | null;
  diagnosis: string;
  condition: string;
  admissionDate: Date;
  notes: string | null;
  doctor: { id: string; name: string; specialization: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PopulatedDoctor {
  _id: Types.ObjectId;
  name: string;
  specialization: string;
}

type PatientRecord = Omit<PatientDoc, 'searchKeywords' | 'doctor'> & {
  doctor: PopulatedDoctor | Types.ObjectId | null;
};

const DOCTOR_FIELDS = 'name specialization';

// `_id` is the tie-breaker so pages are stable when sort keys collide.
export const PATIENT_SORT_SPECS: Record<ListPatientsQuery['sort'], Record<string, SortOrder>> = {
  newest: { admissionDate: -1, _id: -1 },
  oldest: { admissionDate: 1, _id: 1 },
  name_asc: { name: 1, _id: 1 },
  name_desc: { name: -1, _id: -1 },
};

function toPatientDTO(patient: PatientRecord): PatientDTO {
  const doctor = patient.doctor;
  return {
    id: String(patient._id),
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? null,
    diagnosis: patient.diagnosis,
    condition: patient.condition,
    admissionDate: patient.admissionDate,
    notes: patient.notes ?? null,
    doctor:
      doctor && 'name' in doctor
        ? { id: String(doctor._id), name: doctor.name, specialization: doctor.specialization }
        : null,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
}

export function buildPatientFilter(query: ListPatientsQuery, doctorId?: string): QueryFilter<PatientDoc> {
  const filter: QueryFilter<PatientDoc> = { ...buildSearchFilter(query.search) };

  const doctor = doctorId ?? query.doctor;
  if (doctor) filter.doctor = new Types.ObjectId(doctor);
  if (query.condition) filter.condition = { $in: query.condition };
  if (query.gender) filter.gender = query.gender;
  if (query.minAge !== undefined || query.maxAge !== undefined) {
    filter.age = {
      ...(query.minAge !== undefined && { $gte: query.minAge }),
      ...(query.maxAge !== undefined && { $lte: query.maxAge }),
    };
  }
  if (query.from || query.to) {
    filter.admissionDate = {
      ...(query.from && { $gte: query.from }),
      ...(query.to && { $lte: query.to }),
    };
  }
  return filter;
}

export async function listPatients(
  query: ListPatientsQuery,
  options: { doctorId?: string } = {},
): Promise<Paginated<PatientDTO>> {
  const filter = buildPatientFilter(query, options.doctorId);
  const hasFilter = Object.keys(filter).length > 0;

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .sort(PATIENT_SORT_SPECS[query.sort])
      .skip(skipFor(query.page, query.limit))
      .limit(query.limit)
      // One extra `_id: { $in: [...] }` query for the doctors on this page.
      .populate<{ doctor: PopulatedDoctor | null }>('doctor', DOCTOR_FIELDS)
      .lean<PatientRecord[]>(),
    hasFilter ? Patient.countDocuments(filter) : Patient.estimatedDocumentCount(),
  ]);

  return {
    data: patients.map(toPatientDTO),
    meta: buildPageMeta(query.page, query.limit, total),
  };
}

/** Patient counts for a set of doctors in one index-backed aggregation. */
export async function countPatientsByDoctor(doctorIds: Types.ObjectId[]): Promise<Map<string, number>> {
  if (doctorIds.length === 0) return new Map();

  const rows = await Patient.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { doctor: { $in: doctorIds } } },
    { $group: { _id: '$doctor', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

async function assertDoctorExists(id: string): Promise<void> {
  if (!(await Doctor.exists({ _id: id }))) throw ApiError.notFound('Doctor');
}

async function findPopulated(id: Types.ObjectId | string): Promise<PatientDTO> {
  const patient = await Patient.findById(id).populate('doctor', DOCTOR_FIELDS).lean<PatientRecord>();
  if (!patient) throw ApiError.notFound('Patient');
  return toPatientDTO(patient);
}

export async function getPatient(id: string): Promise<PatientDTO> {
  return findPopulated(id);
}

export async function createPatient(input: CreatePatientInput): Promise<PatientDTO> {
  await assertDoctorExists(input.doctor);

  const patient = await Patient.create({
    ...input,
    email: input.email ?? undefined,
    notes: input.notes ?? undefined,
  });
  invalidateStats();
  return findPopulated(patient._id);
}

export async function updatePatient(id: string, input: UpdatePatientInput): Promise<PatientDTO> {
  const patient = await Patient.findById(id);
  if (!patient) throw ApiError.notFound('Patient');

  if (input.doctor && input.doctor !== String(patient.doctor)) {
    await assertDoctorExists(input.doctor);
  }

  const { email, notes, ...rest } = input;
  patient.set(rest);
  // null clears an optional field, undefined leaves it unchanged.
  if (email !== undefined) patient.set('email', email ?? undefined);
  if (notes !== undefined) patient.set('notes', notes ?? undefined);

  await patient.save(); // runs the hook that rebuilds search keywords
  invalidateStats();
  return findPopulated(patient._id);
}

/** Deletes a patient. When `doctorId` is given, the patient must belong to that doctor. */
export async function deletePatient(id: string, options: { doctorId?: string } = {}): Promise<void> {
  const deleted = await Patient.findOneAndDelete({
    _id: id,
    ...(options.doctorId && { doctor: options.doctorId }),
  })
    .select('_id')
    .lean();

  if (!deleted) throw ApiError.notFound('Patient');
  invalidateStats();
}
