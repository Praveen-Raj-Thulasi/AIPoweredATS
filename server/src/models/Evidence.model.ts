import mongoose, { Schema, Document } from 'mongoose';
import { EvidenceItem as IEvidenceItem } from '@ats/shared';

export interface IEvidenceItemDocument extends Omit<IEvidenceItem, 'id'>, Document {}

const EvidenceItemSchema = new Schema<IEvidenceItemDocument>(
  {
    candidateId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    capabilityName: { type: String, required: true, index: true },
    sourceType: {
      type: String,
      enum: [
        'resume',
        'project',
        'portfolio',
        'github_project',
        'certification',
        'assessment',
        'coding_task',
        'interview',
        'transfer_test',
        'recruiter_observation',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    rawContent: { type: String },
    sourceUrl: { type: String },
    sourceScore: { type: Number },
    state: {
      type: String,
      enum: ['supports', 'partially_supports', 'contradicts', 'inconclusive'],
      default: 'supports',
      index: true,
    },
    reliabilityWeight: { type: Number, default: 0.5 },
    isPrivateRecruiterNote: { type: Boolean, default: false },
    authorName: { type: String },
    stageRecorded: { type: String, default: 'applied' },
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

export const EvidenceItemModel = mongoose.model<IEvidenceItemDocument>(
  'EvidenceItem',
  EvidenceItemSchema
);
