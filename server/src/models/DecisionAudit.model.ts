import mongoose, { Schema, Document } from 'mongoose';
import { HumanDecisionRecord as IHumanDecisionRecord } from '@ats/shared';

export interface IHumanDecisionRecordDocument extends Omit<IHumanDecisionRecord, 'id'>, Document {}

const DecisionAuditSchema = new Schema<IHumanDecisionRecordDocument>(
  {
    candidateId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    recruiterId: { type: String, required: true },
    recruiterEmail: { type: String, required: true },
    action: {
      type: String,
      enum: ['advance', 'reject', 'request_more_evidence', 'move_to_interview', 'make_offer'],
      required: true,
    },
    aiAdvisoryState: {
      type: String,
      enum: ['READY', 'MOSTLY_READY', 'INSUFFICIENT_EVIDENCE', 'REQUIRES_REVIEW'],
      required: true,
    },
    evidenceStateSnapshot: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: true }, // Mandatory justification
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

export const DecisionAuditModel = mongoose.model<IHumanDecisionRecordDocument>(
  'DecisionAudit',
  DecisionAuditSchema
);
