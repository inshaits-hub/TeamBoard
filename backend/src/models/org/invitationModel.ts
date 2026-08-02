import mongoose, { Schema, Document, Types } from 'mongoose';
import { SCOPE_TYPES, type ScopeType } from './membershipModel';

export interface IInvitation extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  email: string;
  role: Types.ObjectId;
  scopeType: ScopeType;
  scopeId: Types.ObjectId | null;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: Date;
  invitedBy: Types.ObjectId;
}

const invitationSchema = new Schema<IInvitation>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    scopeType: { type: String, enum: SCOPE_TYPES, default: 'organization' },
    scopeId: { type: Schema.Types.ObjectId, default: null },
    token: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
      default: 'pending',
    },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IInvitation>('Invitation', invitationSchema);
