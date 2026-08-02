import mongoose, { Schema, Document, Types } from 'mongoose';

export const SCOPE_TYPES = ['organization', 'department', 'project', 'team'] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

/**
 * The join record that powers RBAC.
 *
 * A user can hold several memberships in one organization: an org-wide base
 * role plus narrower grants on a department, project or team. Org-scoped
 * grants cascade downwards; narrower grants only apply inside their scope.
 */
export interface IMembership extends Document {
  _id: Types.ObjectId;
  organization: Types.ObjectId;
  user: Types.ObjectId;
  role: Types.ObjectId;
  scopeType: ScopeType;
  scopeId: Types.ObjectId | null;
  /** Reporting line inside the organization. */
  reportsTo: Types.ObjectId | null;
  title: string;
  status: 'active' | 'suspended';
  invitedBy: Types.ObjectId | null;
}

const membershipSchema = new Schema<IMembership>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    scopeType: { type: String, enum: SCOPE_TYPES, default: 'organization' },
    scopeId: { type: Schema.Types.ObjectId, default: null },
    reportsTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, default: '', maxlength: 120 },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

membershipSchema.index(
  { organization: 1, user: 1, scopeType: 1, scopeId: 1 },
  { unique: true }
);

export default mongoose.model<IMembership>('Membership', membershipSchema);
