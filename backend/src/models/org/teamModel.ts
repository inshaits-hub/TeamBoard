import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  department: Types.ObjectId | null;
  parent: Types.ObjectId | null;
  name: string;
  description: string;
  leader: Types.ObjectId | null;
  projects: Types.ObjectId[];
}

const teamSchema = new Schema<ITeam>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    // Sub-teams point at their parent team.
    parent: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 2000 },
    leader: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  },
  { timestamps: true }
);

teamSchema.index({ organization: 1, name: 1 }, { unique: true });

export default mongoose.model<ITeam>('Team', teamSchema);
