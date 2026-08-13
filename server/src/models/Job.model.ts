import mongoose, { Schema, Document } from 'mongoose';
import { Job as IJob } from '@ats/shared';

export interface IJobDocument extends Omit<IJob, 'id'>, Document {}

const JobSchema = new Schema<IJobDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true, default: 'full-time' },
    experienceLevel: { type: String, required: true, default: 'senior' },
    minYearsExperience: { type: Number, required: true, default: 3 },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String, default: 'USD' },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    requirements: [{ type: String }],
    requiredSkills: [{ type: String }],
    preferredSkills: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'closed', 'archived'], default: 'published' },
    openingsCount: { type: Number, default: 1 },
    applicationsCount: { type: Number, default: 0 },
    createdBy: { type: String },
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

export const JobModel = mongoose.model<IJobDocument>('Job', JobSchema);
