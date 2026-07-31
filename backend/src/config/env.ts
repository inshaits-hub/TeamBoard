/**
 * Central, validated access to environment configuration.
 * Fails fast at boot so a misconfigured deployment never starts half-working.
 */

export interface AppEnv {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  clientOrigins: string[];
  customDnsServers: string[];
  nodeEnv: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable ${name}. See backend/.env.example.`
    );
  }
  return value.trim();
}

function list(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function loadEnv(): AppEnv {
  const jwtSecret = required('JWT_SECRET');
  if (jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters long.');
  }

  const clientOrigins = list(process.env.CLIENT_ORIGIN);
  if (clientOrigins.length === 0) {
    throw new Error(
      'CLIENT_ORIGIN must list at least one allowed origin (comma separated).'
    );
  }

  return {
    port: Number(process.env.PORT) || 5000,
    mongoUri: required('MONGO_URI'),
    jwtSecret,
    clientOrigins,
    customDnsServers: list(process.env.DNS_SERVERS),
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

let cached: AppEnv | null = null;

export function env(): AppEnv {
  if (!cached) cached = loadEnv();
  return cached;
}
