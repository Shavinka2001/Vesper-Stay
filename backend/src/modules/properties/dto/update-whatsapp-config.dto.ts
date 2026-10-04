import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

function emptyToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

export class UpdateWhatsAppConfigDto {
  @ApiPropertyOptional({ description: 'Turn WhatsApp sending on/off.' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'WhatsApp Cloud API Phone Number ID.' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(64)
  phoneNumberId?: string;

  @ApiPropertyOptional({
    description: 'Access token — encrypted at rest, never returned. Omit to keep the existing one.',
  })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(1024)
  accessToken?: string;
}
