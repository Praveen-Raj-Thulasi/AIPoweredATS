import mongoose, { Schema, Document } from 'mongoose';
import { CandidateClaim as ICandidateClaim } from '@ats/shared';

export interface ICandidateClaimDocument extends Omit<ICandidateClaim, 'id'>, Document {}

const CandidateClaimSchema = new Schema<ICandidateClaimDocument>(
  {
    candidateId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    capabilityName: { type: String, required: true, index: true },
    claimedProficiency: {
      type: String,
      enum: ['foundational', 'intermediate', 'advanced', 'expert'],
      default: 'advanced',
    },
    claimedYearsOfExperience: { type: Number },
    claimSource: { type: String, required: true },
    excerpt: { type: String, required: true },
    verificationState: {
      type: String,
      enum: ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE'],
      default: 'UNVERIFIED',
      index: true,
    },
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

export const CandidateClaimModel = mongoose.model<ICandidateClaimDocument>(
  'CandidateClaim',
  CandidateClaimSchema
);
