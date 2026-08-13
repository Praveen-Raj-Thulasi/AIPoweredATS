import mongoose, { Schema, Document } from 'mongoose';
import { Candidate as ICandidate } from '@ats/shared';

export interface ICandidateDocument extends Omit<ICandidate, 'id'>, Document {}

const CandidateSchema = new Schema<ICandidateDocument>(
  {
    userId: { type: String, index: true },
    organizationId: { type: String, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    location: { type: String },
    headline: { type: String },
    summary: { type: String },
    skills: [{ type: String }],
    experience: [
      {
        title: String,
        company: String,
        location: String,
        startDate: String,
        endDate: String,
        current: Boolean,
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        fieldOfStudy: String,
        graduationYear: Schema.Types.Mixed,
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'blacklisted'],
      default: 'active',
      index: true,
    },
    tags: [{ type: String }],
    comments: [
      {
        id: String,
        authorId: String,
        authorName: String,
        authorRole: String,
        content: String,
        createdAt: String,
      },
    ],
    resumeUrl: { type: String },
    resumeKey: { type: String },
    resumeFileName: { type: String },
    resumeRawText: { type: String },
    resumeParsingStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    parserMetadata: { type: Schema.Types.Mixed },
    linkedInUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },
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

export const CandidateModel = mongoose.model<ICandidateDocument>('Candidate', CandidateSchema);
