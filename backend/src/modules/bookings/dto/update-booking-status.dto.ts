import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BookingStatus } from '@generated/prisma/client';

const UPDATABLE_STATUSES = [
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.CHECKED_OUT,
  BookingStatus.CANCELLED,
] as const;

export type UpdatableBookingStatus = (typeof UPDATABLE_STATUSES)[number];

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: UPDATABLE_STATUSES,
    example: BookingStatus.CHECKED_IN,
  })
  @IsEnum(UPDATABLE_STATUSES)
  status!: UpdatableBookingStatus;
}
