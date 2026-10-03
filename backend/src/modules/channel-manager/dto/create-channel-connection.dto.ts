import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ChannelSyncDirection, ChannelType } from '@generated/prisma/client';

function emptyToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

export class CreateChannelConnectionDto {
  @ApiProperty({ enum: ChannelType, example: ChannelType.AIRBNB })
  @IsEnum(ChannelType)
  channelType!: ChannelType;

  @ApiProperty({ example: 'Airbnb — Deluxe Cabana 3' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    description: 'Room this listing maps to (required for import sync).',
  })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({
    example: 'https://www.airbnb.com/calendar/ical/12345.ics?s=abcdef',
    description: 'External iCal feed URL to import (Airbnb/Booking.com).',
  })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  iCalImportUrl?: string;

  @ApiPropertyOptional({
    enum: ChannelSyncDirection,
    default: ChannelSyncDirection.BIDIRECTIONAL,
  })
  @IsOptional()
  @IsEnum(ChannelSyncDirection)
  syncDirection?: ChannelSyncDirection;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
