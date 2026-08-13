import mongoose, { Schema, Document } from 'mongoose';
import { Application as IApplication } from '@ats/shared';

export interface IApplicationDocument extends Omit<IApplication, 'id'>, Document {}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    jobTitle: { type: String },
    candidateId: { type: String, required: true, index: true },
    stage: {
      type: String,
      enum: ['applied', 'screening', 'technical_interview', 'cultural_fit', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    status: {
      type: String,
      enum: ['active', 'hired', 'rejected', 'withdrawn'],
      default: 'active',
    },
    aiScoreCard: {
      overallScore: Number,
      recommendation: String,
      summary: String,
      skillMatchPercentage: Number,
      skillsAnalysis: [
        {
          skill: String,
          status: String,
          proficiencyEstimated: String,
          notes: String,
        },
      ],
      matchedSkills: [String],
      missingSkills: [String],
      experienceScore: Number,
      educationScore: Number,
      relevanceSummary: String,
      keyStrengths: [String],
      potentialGaps: [String],
      suggestedInterviewQuestions: [
        {
          question: String,
          targetTopic: String,
          expectedInsight: String,
        },
      ],
      evaluatedAt: String,
      llmModelUsed: String,
    },
    notes: [
      {
        id: String,
        authorName: String,
        authorRole: String,
        content: String,
        createdAt: String,
      },
    ],
    timeline: [
      {
        id: String,
        stage: String,
        title: String,
        description: String,
        timestamp: String,
        actorName: String,
      },
    ],
    appliedAt: { type: String, default: () => new Date().toISOString() },
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

export const ApplicationModel = mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
