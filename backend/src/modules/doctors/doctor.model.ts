import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { SPECIALIZATIONS } from '../../config/constants.js';
import { buildSearchKeywords } from '../../lib/search.js';

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    specialization: { type: String, required: true, enum: SPECIALIZATIONS },
    hospital: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    searchKeywords: { type: [String], default: [], select: false },
  },
  { timestamps: true },
);

doctorSchema.pre('validate', function () {
  this.searchKeywords = buildSearchKeywords(
    this.name,
    this.email,
    this.hospital,
    this.specialization,
    this.phone,
  );
});

doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ createdAt: -1, _id: -1 });
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });
doctorSchema.index({ name: 1, _id: 1 });
doctorSchema.index({ searchKeywords: 1 });

export type DoctorDoc = InferSchemaType<typeof doctorSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export const Doctor = model('Doctor', doctorSchema);
