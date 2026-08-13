import mongoose, { Schema, Document } from 'mongoose';
import { AuditLog as IAuditLog } from '@ats/shared';

export interface IAuditLogDocument extends Omit<IAuditLog, 'id'>, Document {}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: { type: String, index: true },
    userEmail: { type: String },
    organizationId: { type: String, index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

export const AuditLogModel = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
