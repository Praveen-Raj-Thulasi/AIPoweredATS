import mongoose, { Schema, Document } from 'mongoose';
import { Interview as IInterview } from '@ats/shared';

export interface IInterviewDocument extends Omit<IInterview, 'id'>, Document {}

const InterviewSchema = new Schema<IInterviewDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    jobTitle: { type: String },
    candidateName: { type: String },
    candidateEmail: { type: String },
    interviewerNames: [{ type: String }],
    interviewType: {
      type: String,
      enum: ['screening', 'technical', 'behavioral', 'culture_fit', 'executive'],
      default: 'technical',
    },
    scheduledAt: { type: String, required: true, index: true },
    durationMinutes: { type: Number, default: 45 },
    meetingLink: { type: String },
    location: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    notes: { type: String },
    feedback: {
      rating: Number,
      recommendation: String,
      summary: String,
      submittedAt: String,
    },
    createdBy: { type: String, required: true },
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

export const InterviewModel = mongoose.model<IInterviewDocument>('Interview', InterviewSchema);
