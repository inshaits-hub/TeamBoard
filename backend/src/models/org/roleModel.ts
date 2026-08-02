import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRole extends Document {
  _id: Types.ObjectId;
  /** Null for the built-in system roles shared by every organization. */
  organization: Types.ObjectId | null;
  key: string;
  name: string;
  description: string;
  rank: number;
  /** Permission strings, or ['*'] for unrestricted. */
  permissions: string[];
  isSystem: boolean;
}

const roleSchema = new Schema<IRole>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    key: { type: String, required: true, trim: true, maxlength: 60 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', maxlength: 1000 },
    rank: { type: Number, default: 5 },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

roleSchema.index({ organization: 1, key: 1 }, { unique: true });

export default mongoose.model<IRole>('Role', roleSchema);
