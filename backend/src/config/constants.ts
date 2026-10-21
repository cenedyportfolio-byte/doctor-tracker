// Domain enums shared by models, validation schemas and the seed script.
// The frontend mirrors these in `frontend/src/lib/constants.ts`.

export const ROLES = ['admin', 'viewer'] as const;
export type Role = (typeof ROLES)[number];

export const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'General Medicine',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
] as const;
export type Specialization = (typeof SPECIALIZATIONS)[number];

export const PATIENT_CONDITIONS = [
  'stable',
  'under_observation',
  'critical',
  'recovering',
  'discharged',
] as const;
export type PatientCondition = (typeof PATIENT_CONDITIONS)[number];

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];
