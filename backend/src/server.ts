import dotenv from 'dotenv';
dotenv.config();

import { env } from './config/env';
import connectDB from './config/database';

const start = async () => {
  const { port } = env();
  await connectDB();

  // Lazy import so env validation runs before any route module loads.
  const { default: app } = await import('./app');

  app.listen(port, '0.0.0.0', () =>
    console.log(`Server running on port ${port}`)
  );
};

start().catch((err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : err);
  process.exit(1);
});
