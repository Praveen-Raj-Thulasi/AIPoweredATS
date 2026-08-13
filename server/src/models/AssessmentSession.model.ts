import mongoose, { Schema, Document } from 'mongoose';
import { AssessmentSession as IAssessmentSession } from '@ats/shared';

export interface IAssessmentSessionDocument extends Omit<IAssessmentSession, 'id'>, Document {}

const AssessmentSessionSchema = new Schema<IAssessmentSessionDocument>(
  {
    candidateId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    currentChallengeIndex: { type: Number, default: 1 },
    totalChallengesCount: { type: Number, default: 4 },
    currentChallenge: { type: Schema.Types.Mixed },
    attempts: [{ type: Schema.Types.Mixed }],
    uncertaintyBefore: { type: Number, default: 100 },
    uncertaintyAfter: { type: Number },
    capabilityImpact: [{ type: Schema.Types.Mixed }],
    startedAt: { type: String, required: true },
    completedAt: { type: String },
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

export const AssessmentSessionModel = mongoose.model<IAssessmentSessionDocument>(
  'AssessmentSession',
  AssessmentSessionSchema
);
