import mongoose, { Schema, Document } from 'mongoose';
import { User as IUser } from '@ats/shared';

export interface IUserDocument extends Omit<IUser, 'id'>, Document {
  passwordHash: string;
  refreshTokenHash?: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['candidate', 'recruiter', 'admin'], required: true, default: 'candidate', index: true },
    organizationId: { type: String, index: true },
    candidateProfileId: { type: String, index: true },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'deactivated'],
      default: 'active',
      index: true,
    },
    avatarUrl: { type: String },
    lastLoginAt: { type: String },
    refreshTokenHash: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        return ret;
      },
    },
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
