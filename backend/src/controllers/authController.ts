import { Request, Response } from 'express';
import User from '../models/userModel';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../middleware/errorMiddleware';
import {
  loginSchema,
  registerSchema,
  createMemberSchema,
  updateMemberSchema,
} from '../validation/schemas';

const publicUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  organization: string;
}) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const { name, email, password, organization } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, 'Email already registered');

  const user = await User.create({
    name,
    email,
    password: await hashPassword(password),
    organization,
    role: 'admin',
  });

  res.status(201).json({
    token: generateToken(user._id.toString()),
    user: publicUser(user),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  // Same generic message for unknown email and wrong password.
  if (!user) throw new HttpError(401, 'Invalid credentials');

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new HttpError(401, 'Invalid credentials');

  res.json({
    token: generateToken(user._id.toString()),
    user: publicUser(user),
  });
});

export const getMe = asyncHandler<AuthRequest>(async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  if (!user) throw new HttpError(404, 'User not found');
  res.json(publicUser(user));
});

export const createMember = asyncHandler<AuthRequest>(async (req, res) => {
  const parsed = createMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const admin = await User.findById(req.userId);
  if (!admin) throw new HttpError(404, 'Admin not found');
  if (admin.role !== 'admin') throw new HttpError(403, 'Only admins can create team members');

  const { name, email, password } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, 'Email already registered');

  const member = await User.create({
    name,
    email,
    password: await hashPassword(password),
    role: 'member',
    organization: admin.organization,
    createdBy: admin._id,
  });

  res.status(201).json({
    id: String(member._id),
    name: member.name,
    email: member.email,
    role: member.role,
  });
});

export const listMembers = asyncHandler<AuthRequest>(async (req, res) => {
  const admin = await User.findById(req.userId);
  if (!admin) throw new HttpError(404, 'Admin not found');

  const members = await User.find({
    createdBy: admin._id,
  }).select('name email role createdAt');

  res.json({ members });
});

export const deleteMember = asyncHandler<AuthRequest>(async (req, res) => {
  const admin = await User.findById(req.userId);
  if (!admin) throw new HttpError(404, 'Admin not found');
  if (admin.role !== 'admin') throw new HttpError(403, 'Only admins can delete team members');

  const member = await User.findOne({
    _id: req.params.id,
    createdBy: admin._id,
  });

  if (!member) throw new HttpError(404, 'Team member not found');

  await User.deleteOne({ _id: member._id });
  res.json({ ok: true });
});

export const getOrgInfo = asyncHandler<AuthRequest>(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(404, 'User not found');

  const memberCount = await User.countDocuments({
    $or: [{ createdBy: user._id }, { _id: user._id, role: 'admin' }],
  });

  res.json({
    organization: user.organization,
    memberCount,
    role: user.role,
  });
});
