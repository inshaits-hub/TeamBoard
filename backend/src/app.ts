import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorMiddleware';

const app = express();
const { clientOrigins } = env();

app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server / curl requests that send no Origin header.
      if (!origin) return callback(null, true);
      if (clientOrigins.includes('*') || clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
