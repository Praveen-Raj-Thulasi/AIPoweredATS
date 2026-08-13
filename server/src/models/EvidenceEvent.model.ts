import mongoose, { Schema, Document } from 'mongoose';
import { EvidenceEvent as IEvidenceEvent } from '@ats/shared';

export interface IEvidenceEventDocument extends Omit<IEvidenceEvent, 'id'>, Document {}

const EvidenceEventSchema = new Schema<IEvidenceEventDocument>(
  {
    candidateId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    capabilityName: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: [
        'claim_extracted',
        'evidence_added',
        'assessment_completed',
        'interview_evaluated',
        'manual_override',
      ],
      required: true,
    },
    description: { type: String, required: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    timestamp: { type: String, required: true },
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

export const EvidenceEventModel = mongoose.model<IEvidenceEventDocument>(
  'EvidenceEvent',
  EvidenceEventSchema
);
