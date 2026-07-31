import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN, // set in .env, never hardcoded
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);

export default app;