import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrganization extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  plan: 'free' | 'team' | 'business' | 'enterprise';
  owner: Types.ObjectId;
  settings: {
    timezone: string;
    weekStartsOn: number;
    requireApprovalForInvites: boolean;
    enforceMfa: boolean;
  };
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: {
      type: String,
      enum: ['free', 'team', 'business', 'enterprise'],
      default: 'free',
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    settings: {
      timezone: { type: String, default: 'UTC' },
      weekStartsOn: { type: Number, default: 1, min: 0, max: 6 },
      requireApprovalForInvites: { type: Boolean, default: false },
      enforceMfa: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrganization>('Organization', organizationSchema);
