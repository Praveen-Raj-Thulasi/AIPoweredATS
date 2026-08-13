import mongoose, { Schema, Document } from 'mongoose';
import { Organization as IOrganization } from '@ats/shared';

export interface IOrganizationDocument extends Omit<IOrganization, 'id'>, Document {}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    plan: { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'growth' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    domain: { type: String, trim: true },
    logoUrl: { type: String },
    settings: {
      enableAiScreening: { type: Boolean, default: true },
      defaultCurrency: { type: String, default: 'USD' },
      autoReplyEmail: { type: Boolean, default: true },
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

export const OrganizationModel = mongoose.model<IOrganizationDocument>('Organization', OrganizationSchema);
