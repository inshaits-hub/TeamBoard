import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
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
    // Manual drag ordering, persisted separately per view.
    boardOrder: { type: [String], default: [] },
    listOrder: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
