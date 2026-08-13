import mongoose, { Schema, Document } from 'mongoose';
import { JobCapabilityModel as IJobCapabilityModel } from '@ats/shared';

export interface IJobCapabilityModelDocument extends Omit<IJobCapabilityModel, 'id'>, Document {}

const CapabilitySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
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
    description: { type: String, required: true },
    importance: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    expectedProficiency: {
      type: String,
      enum: ['foundational', 'intermediate', 'advanced', 'expert'],
      required: true,
    },
    evaluationMethods: [{ type: String }],
    dependencies: [{ type: String }],
    transferableConcepts: [{ type: String }],
    evidenceRequirements: [{ type: String }],
    freshnessRequirements: { type: String },
    confidenceScore: { type: Number },
  },
  { _id: false }
);

const CapabilityRelationshipSchema = new Schema(
  {
    id: { type: String, required: true },
    sourceName: { type: String, required: true },
    targetName: { type: String, required: true },
    relationshipType: {
      type: String,
      enum: ['prerequisite_for', 'builds_upon', 'transfers_to', 'frequently_paired_with'],
      required: true,
    },
    strength: { type: Number, default: 0.8 },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const RecruiterModificationSchema = new Schema(
  {
    id: { type: String, required: true },
    action: {
      type: String,
      enum: ['add_capability', 'edit_capability', 'remove_capability', 'approve'],
      required: true,
    },
    targetCapabilityName: { type: String },
    details: { type: String, required: true },
    modifiedBy: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { _id: false }
);

const JobCapabilityModelSchema = new Schema<IJobCapabilityModelDocument>(
  {
    jobId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'customized'],
      default: 'pending_review',
      index: true,
    },
    capabilities: [CapabilitySchema],
    relationships: [CapabilityRelationshipSchema],
    originalJdSnapshot: {
      title: String,
      description: String,
      requirements: [String],
      requiredSkills: [String],
      experienceLevel: String,
    },
    aiProviderUsed: { type: String, required: true },
    modelName: { type: String, required: true },
    compilationDurationMs: { type: Number, default: 0 },
    modifications: [RecruiterModificationSchema],
    approvedBy: { type: String },
    approvedAt: { type: String },
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

export const JobCapabilityModelModel = mongoose.model<IJobCapabilityModelDocument>(
  'JobCapabilityModel',
  JobCapabilityModelSchema
);
