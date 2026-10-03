import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BookingSource, BookingStatus, PaymentMethod } from '@generated/prisma/client';

const CREATE_PAYMENT_METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.ONLINE,
] as const;

const CREATE_STATUSES = [
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
] as const;

function emptyToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
}

export class BookingGuestDto {
  @ApiProperty({ example: 'Amara' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({ example: 'amara.silva@example.com' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    example: '+94771234567',
    description: 'WhatsApp number in E.164 format',
  })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'N1234567' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(64)
  idPassport?: string;

  @ApiPropertyOptional({ example: 'Sri Lanka' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: 'Sri Lankan' })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(80)
  nationality?: string;
}

export class CreateBookingDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  roomId!: string;

  @ApiProperty({ type: BookingGuestDto })
  @ValidateNested()
  @Type(() => BookingGuestDto)
  guest!: BookingGuestDto;

  @ApiProperty({ example: '2026-09-12', description: 'ISO date (YYYY-MM-DD)' })
  @IsDateString()
  checkInDate!: string;

  @ApiProperty({ example: '2026-09-15', description: 'ISO date (YYYY-MM-DD)' })
  @IsDateString()
  checkOutDate!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  adultsCount!: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  childrenCount?: number;

  @ApiProperty({ example: 450.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount!: number;

  @ApiPropertyOptional({ example: 100.0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({
    enum: CREATE_PAYMENT_METHODS,
    example: PaymentMethod.CASH,
    description: 'Payment method for the advance (CARD = Stripe card)',
  })
  @IsOptional()
  @IsIn(CREATE_PAYMENT_METHODS)
  paymentMethod?: (typeof CREATE_PAYMENT_METHODS)[number];

  @ApiProperty({
    enum: BookingSource,
    example: BookingSource.FRONT_DESK,
  })
  @IsEnum(BookingSource)
  source!: BookingSource;

  @ApiPropertyOptional({
    enum: CREATE_STATUSES,
    example: BookingStatus.CONFIRMED,
    description: 'CONFIRMED reservation or CHECKED_IN for walk-in',
  })
  @IsOptional()
  @IsIn(CREATE_STATUSES)
  status?: (typeof CREATE_STATUSES)[number];

  @ApiPropertyOptional({
    example: 'Late check-in after 21:00; champagne on arrival',
  })
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(1000)
  specialRequests?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Walk-in: set CHECKED_IN, room OCCUPIED, and return WhatsApp welcome',
  })
  @IsOptional()
  @IsBoolean()
  instantCheckIn?: boolean;
}
