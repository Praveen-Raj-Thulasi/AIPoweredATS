import mongoose, { Schema, Document } from 'mongoose';
import { Offer as IOffer } from '@ats/shared';

export interface IOfferDocument extends Omit<IOffer, 'id'>, Document {}

const OfferSchema = new Schema<IOfferDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    candidateId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    candidateName: { type: String },
    candidateEmail: { type: String },
    jobTitle: { type: String },
    baseSalary: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    equity: { type: String },
    bonus: { type: String },
    startDate: { type: String, required: true },
    expirationDate: { type: String, required: true },
    customTerms: { type: String },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },
    sentAt: { type: String },
    respondedAt: { type: String },
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

export const OfferModel = mongoose.model<IOfferDocument>('Offer', OfferSchema);
