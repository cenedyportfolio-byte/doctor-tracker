import { z } from 'zod';
import { SPECIALIZATIONS } from '../../config/constants.js';
import {
  dateRangeQuery,
  email,
  listOf,
  pageQuery,
  personName,
  phone,
  searchQuery,
} from '../../lib/validation.js';

const doctorFields = {
  name: personName,
  specialization: z.enum(SPECIALIZATIONS, { error: 'Choose a valid specialization' }),
  hospital: z.string().trim().min(2, 'Hospital is required').max(120),
  phone,
  email,
};

// `.strict()` rejects unknown keys, so clients can't write derived or internal fields.
export const createDoctorBody = z.object(doctorFields).strict();

export const updateDoctorBody = z
  .object(doctorFields)
  .partial()
  .strict()
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');

export const DOCTOR_SORTS = ['newest', 'oldest', 'name_asc', 'name_desc'] as const;

export const listDoctorsQuery = z.object({
  ...pageQuery,
  ...dateRangeQuery,
  search: searchQuery,
  specialization: listOf(z.enum(SPECIALIZATIONS)),
  hospital: z.string().trim().max(120).optional(),
  sort: z.enum(DOCTOR_SORTS).default('newest'),
});

export const doctorOptionsQuery = z.object({
  search: searchQuery,
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateDoctorInput = z.output<typeof createDoctorBody>;
export type UpdateDoctorInput = z.output<typeof updateDoctorBody>;
export type ListDoctorsQuery = z.output<typeof listDoctorsQuery>;
export type DoctorOptionsQuery = z.output<typeof doctorOptionsQuery>;
