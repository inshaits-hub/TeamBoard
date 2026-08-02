import mongoose, { Schema, Document, Types } from 'mongoose';

export const PROJECT_STATUSES = [
  'planning',
  'active',
  'on-hold',
  'completed',
  'archived',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface IProject extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  department: Types.ObjectId | null;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  lead: Types.ObjectId | null;
  startDate: string;
  targetDate: string;
  color: string;
}

const projectSchema = new Schema<IProject>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    // Short ticket prefix, e.g. "WEB" -> WEB-128
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 10 },
    description: { type: String, default: '', maxlength: 5000 },
    status: { type: String, enum: PROJECT_STATUSES, default: 'active' },
    lead: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startDate: { type: String, default: '' },
    targetDate: { type: String, default: '' },
    color: { type: String, default: 'violet' },
  },
  { timestamps: true }
);

projectSchema.index({ organization: 1, key: 1 }, { unique: true });

export default mongoose.model<IProject>('Project', projectSchema);
