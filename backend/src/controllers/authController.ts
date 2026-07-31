import { Request, Response } from 'express';
import User from '../models/userModel';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/authMiddleware';
import { HttpError, asyncHandler } from '../middleware/errorMiddleware';
import { loginSchema, registerSchema } from '../validation/schemas';

const publicUser = (user: { _id: unknown; name: string; email: string }) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Invalid request', parsed.error.flatten().fieldErrors);
  }

  const { name, email, password } = parsed.data;
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, 'Email already registered');

  const user = await User.create({
    name,
    email,
    password: await hashPassword(password),
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
