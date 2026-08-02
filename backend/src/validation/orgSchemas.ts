import { z } from 'zod';
import { PERMISSIONS } from '../rbac/permissions';
import { PROJECT_STATUSES } from '../models/org/projectModel';
import { SCOPE_TYPES } from '../models/org/membershipModel';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const optionalObjectId = objectId.nullable().optional();
const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .or(z.literal(''));

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes')
    .min(2)
    .max(60)
    .optional(),
  plan: z.enum(['free', 'team', 'business', 'enterprise']).optional(),
});

export const organizationUpdateSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  plan: z.enum(['free', 'team', 'business', 'enterprise']).optional(),
  settings: z
    .object({
      timezone: z.string().trim().max(60).optional(),
      weekStartsOn: z.number().int().min(0).max(6).optional(),
      requireApprovalForInvites: z.boolean().optional(),
      enforceMfa: z.boolean().optional(),
    })
    .optional(),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(''),
  parent: optionalObjectId,
  head: optionalObjectId,
});

export const departmentUpdateSchema = departmentSchema.partial();

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,10}$/, 'Key must be 2-10 letters or digits'),
  description: z.string().max(5000).default(''),
  status: z.enum(PROJECT_STATUSES).default('active'),
  department: optionalObjectId,
  lead: optionalObjectId,
  startDate: isoDay.default(''),
  targetDate: isoDay.default(''),
  color: z.string().trim().max(24).default('violet'),
});

export const projectUpdateSchema = projectSchema.partial();

export const teamSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(''),
  department: optionalObjectId,
  parent: optionalObjectId,
  leader: optionalObjectId,
  projects: z.array(objectId).max(100).default([]),
});

export const teamUpdateSchema = teamSchema.partial();

export const roleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().max(1000).default(''),
  rank: z.number().int().min(0).max(10).default(5),
  permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length),
});

export const roleUpdateSchema = roleSchema.partial();

export const invitationSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  roleId: objectId,
  scopeType: z.enum(SCOPE_TYPES).default('organization'),
  scopeId: optionalObjectId,
});

export const membershipUpdateSchema = z.object({
  roleId: objectId.optional(),
  title: z.string().trim().max(120).optional(),
  reportsTo: optionalObjectId,
  status: z.enum(['active', 'suspended']).optional(),
  scopeType: z.enum(SCOPE_TYPES).optional(),
  scopeId: optionalObjectId,
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(10).max(200),
  name: z.string().trim().min(1).max(80).optional(),
  password: z.string().min(8).max(128).optional(),
});
