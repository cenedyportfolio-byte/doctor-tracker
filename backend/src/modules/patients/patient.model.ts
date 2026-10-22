import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { GENDERS, PATIENT_CONDITIONS } from '../../config/constants.js';
import { buildSearchKeywords } from '../../lib/search.js';

const patientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, required: true, enum: GENDERS },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    diagnosis: { type: String, required: true, trim: true, maxlength: 120 },
    condition: { type: String, required: true, enum: PATIENT_CONDITIONS, default: 'stable' },
    admissionDate: { type: Date, required: true, default: () => new Date() },
    notes: { type: String, trim: true, maxlength: 1000 },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    searchKeywords: { type: [String], default: [], select: false },
  },
  { timestamps: true },
);

patientSchema.pre('validate', function () {
  this.searchKeywords = buildSearchKeywords(this.name, this.email, this.phone, this.diagnosis);
});

patientSchema.index({ doctor: 1, admissionDate: -1, _id: -1 });
patientSchema.index({ admissionDate: -1, _id: -1, condition: 1 });
patientSchema.index({ condition: 1, admissionDate: -1, _id: -1 });
patientSchema.index({ name: 1, _id: 1 });
patientSchema.index({ searchKeywords: 1 });

export type PatientDoc = InferSchemaType<typeof patientSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export const Patient = model('Patient', patientSchema);
