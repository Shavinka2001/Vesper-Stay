import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  PORT = 5000;

  @IsString()
  @IsOptional()
  API_PREFIX = 'api';

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_URL = 'redis://localhost:6379';

  @IsString()
  @MinLength(16)
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN = '1d';

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${messages}`);
  }

  return validated;
}
