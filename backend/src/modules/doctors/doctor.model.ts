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
    // Derived; see lib/search.ts. Never sent to clients.
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

// Unique contact email; also serves exact-match lookups.
doctorSchema.index({ email: 1 }, { unique: true });
// Sort indexes end in `_id` because every listing sorts with an `_id` tie-breaker.
// Default listing order and the "joined" date filter.
doctorSchema.index({ createdAt: -1, _id: -1 });
// Specialization filter + default sort in a single index scan.
doctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
// Hospital filter and distinct() for the filter dropdown.
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });
// Alphabetical sorting.
doctorSchema.index({ name: 1, _id: 1 });
// Prefix search (multikey).
doctorSchema.index({ searchKeywords: 1 });

export type DoctorDoc = InferSchemaType<typeof doctorSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export const Doctor = model('Doctor', doctorSchema);
