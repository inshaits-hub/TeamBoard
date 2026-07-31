import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (userId: string): string =>
  jwt.sign({ id: userId }, env().jwtSecret, { expiresIn: '7d' });

export const verifyToken = (token: string): { id: string } =>
  jwt.verify(token, env().jwtSecret) as { id: string };
