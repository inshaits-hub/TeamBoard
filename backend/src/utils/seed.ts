import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import User from '../models/userModel';
import { hashPassword } from './hash';

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'test@example.com' });
  if (existing) {
    console.log('Seed user already exists, skipping.');
  } else {
    const hashed = await hashPassword('test123');
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashed,
    });
    console.log('Seed user created: test@example.com / test123');
  }

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});