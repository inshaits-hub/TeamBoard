import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set in .env');
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { id: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set in .env');
  return jwt.verify(token, secret) as { id: string };
};