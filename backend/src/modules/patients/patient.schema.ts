import { z } from 'zod';
import { GENDERS, PATIENT_CONDITIONS } from '../../config/constants.js';
import {
  dateRangeQuery,
  email,
  listOf,
  objectId,
  pageQuery,
  personName,
  phone,
  searchQuery,
} from '../../lib/validation.js';

const clearable = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal('').transform(() => null), z.null(), schema]).optional();

const admissionDate = z.coerce
  .date({ error: 'Enter a valid admission date' })
  .refine((date) => date.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
    message: 'Admission date cannot be in the future',
  });

const patientFields = {
  name: personName,
  age: z.coerce.number().int('Age must be a whole number').min(0).max(120),
  gender: z.enum(GENDERS, { error: 'Choose a gender' }),
  phone,
  email: clearable(email),
  diagnosis: z.string().trim().min(2, 'Diagnosis is required').max(120),
  condition: z.enum(PATIENT_CONDITIONS, { error: 'Choose a valid condition' }),
  admissionDate: admissionDate.optional(),
  notes: clearable(z.string().trim().max(1000)),
};

export const createDoctorPatientBody = z.object(patientFields).strict();

export const createPatientBody = z.object({ ...patientFields, doctor: objectId }).strict();

export const updatePatientBody = z
  .object({ ...patientFields, doctor: objectId })
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');

const PATIENT_SORTS = ['newest', 'oldest', 'name_asc', 'name_desc'] as const;

export const listPatientsQuery = z
  .object({
    ...pageQuery,
    ...dateRangeQuery,
    search: searchQuery,
    condition: listOf(z.enum(PATIENT_CONDITIONS)),
    gender: z.enum(GENDERS).optional(),
    doctor: objectId.optional(),
    minAge: z.coerce.number().int().min(0).max(120).optional(),
    maxAge: z.coerce.number().int().min(0).max(120).optional(),
    sort: z.enum(PATIENT_SORTS).default('newest'),
  })
  .refine((q) => q.minAge === undefined || q.maxAge === undefined || q.minAge <= q.maxAge, {
    message: 'minAge must be less than or equal to maxAge',
    path: ['minAge'],
  });

export const doctorPatientParams = z.object({ id: objectId, patientId: objectId });

export type CreatePatientInput = z.output<typeof createPatientBody>;
export type UpdatePatientInput = z.output<typeof updatePatientBody>;
export type ListPatientsQuery = z.output<typeof listPatientsQuery>;
