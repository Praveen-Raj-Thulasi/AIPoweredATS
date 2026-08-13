import mongoose, { Schema, Document } from 'mongoose';
import { InterviewSessionState as IInterviewSessionState } from '@ats/shared';

export interface IInterviewSessionDocument extends Omit<IInterviewSessionState, 'id'>, Document {}

const InterviewSessionSchema = new Schema<IInterviewSessionDocument>(
  {
    interviewId: { type: String },
    applicationId: { type: String },
    candidateId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    mode: {
      type: String,
      enum: [
        'structured_recruiter',
        'ai_assisted',
        'candidate_self_recorded',
        'human_interviewer_notes',
        'combined_evaluation',
      ],
      default: 'ai_assisted',
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    plan: { type: Schema.Types.Mixed, required: true },
    currentTurnIndex: { type: Number, default: 1 },
    turns: [{ type: Schema.Types.Mixed }],
    interviewerNotes: { type: String },
    combinedEvaluation: { type: Schema.Types.Mixed },
    privacyRetentionDays: { type: Number, default: 90 },
    startedAt: { type: String },
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

export const InterviewSessionModel = mongoose.model<IInterviewSessionDocument>(
  'InterviewSession',
  InterviewSessionSchema
);
