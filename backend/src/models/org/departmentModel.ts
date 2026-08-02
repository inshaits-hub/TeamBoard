import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  name: string;
  description: string;
  parent: Types.ObjectId | null;
  head: Types.ObjectId | null;
}

const departmentSchema = new Schema<IDepartment>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 2000 },
    parent: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    head: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

departmentSchema.index({ organization: 1, name: 1 }, { unique: true });

export default mongoose.model<IDepartment>('Department', departmentSchema);
