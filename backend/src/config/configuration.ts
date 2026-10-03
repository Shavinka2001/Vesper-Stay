import type { AppConfig } from '@config/config.types';

export default (): AppConfig => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '5000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
});

function parseCorsOrigin(
  value: string | undefined,
): boolean | string | string[] {
  if (!value || value === '*') {
    return true;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    return true;
  }

  return origins.length === 1 ? (origins[0] as string) : origins;
}
