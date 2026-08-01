import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'member';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organization: string;
  createdBy: Types.ObjectId | null;
  boardOrder: string[];
  listOrder: string[];
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'admin',
    },
    organization: { type: String, default: '', trim: true, maxlength: 200 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Manual drag ordering, persisted separately per view.
    boardOrder: { type: [String], default: [] },
    listOrder: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
