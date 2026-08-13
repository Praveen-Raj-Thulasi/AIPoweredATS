import mongoose, { Schema, Document } from 'mongoose';
import { CandidateCapability as ICandidateCapability } from '@ats/shared';

export interface ICandidateCapabilityDocument extends Omit<ICandidateCapability, 'id'>, Document {}

const CandidateCapabilitySchema = new Schema<ICandidateCapabilityDocument>(
  {
    candidateId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    capabilityName: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: [
        'languages_frameworks',
        'systems_architecture',
        'data_storage',
        'cloud_devops',
        'testing_quality',
        'domain_knowledge',
        'soft_skills',
      ],
      required: true,
    },
    verificationState: {
      type: String,
      enum: ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE'],
      default: 'INSUFFICIENT_EVIDENCE',
      index: true,
    },
    confidenceScore: { type: Number, default: 0 },
    evidenceCount: { type: Number, default: 0 },
    evidenceQualityScore: { type: Number, default: 0 },
    evidenceDiversityScore: { type: Number, default: 0 },
    freshnessDate: { type: String },
    evidenceBreakdown: [
      {
        sourceType: String,
        status: String,
        label: String,
        count: Number,
      },
    ],
    recommendedAction: { type: String },
    isManualOverride: { type: Boolean, default: false },
    overrideReason: { type: String },
    overrideBy: { type: String },
    overrideAt: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CandidateCapabilityModel = mongoose.model<ICandidateCapabilityDocument>(
  'CandidateCapability',
  CandidateCapabilitySchema
);
