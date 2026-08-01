import { z } from 'zod';
import {
  COLUMN_IDS,
  LABELS,
  PRIORITIES,
} from '../models/taskModel';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  organization: z.string().trim().min(1, 'Organization name is required').max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required').max(128),
});

export const createMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});

export const updateMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80).optional(),
  email: z.string().trim().toLowerCase().email('A valid email is required').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .optional(),
});

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD')
  .or(z.literal(''));

export const taskSchema = z.object({
  clientId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(5000).default(''),
  column: z.enum(COLUMN_IDS).default('todo'),
  priority: z.enum(PRIORITIES).default('medium'),
  label: z.enum(LABELS).default('design'),
  dueDate: isoDate.default(''),
  assignee: z.string().max(80).default('Me'),
  comments: z.number().int().min(0).default(0),
  attachments: z.number().int().min(0).default(0),
  boardIndex: z.number().int().default(0),
  listIndex: z.number().int().default(0),
  createdAtISO: z.string().default(() => new Date().toISOString()),
});

export const taskUpdateSchema = taskSchema.partial().omit({ clientId: true });

export const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(['column', 'priority', 'delete']),
  column: z.enum(COLUMN_IDS).optional(),
  priority: z.enum(PRIORITIES).optional(),
});

export const orderSchema = z.object({
  boardOrder: z.array(z.string().min(1)).max(2000).optional(),
  listOrder: z.array(z.string().min(1)).max(2000).optional(),
});

export const replaceAllSchema = z.object({
  tasks: z.array(taskSchema).max(2000),
  boardOrder: z.array(z.string()).max(2000).optional(),
  listOrder: z.array(z.string()).max(2000).optional(),
});
