import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@generated/prisma/client';

export const STAFF_ASSIGNABLE_ROLES = [
  UserRole.MANAGER,
  UserRole.FRONT_DESK,
  UserRole.HOUSEKEEPING,
] as const;

export type StaffAssignableRole = (typeof STAFF_ASSIGNABLE_ROLES)[number];

export class CreateStaffDto {
  @ApiProperty({ example: 'Nimal' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Perera' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: 'nimal@vesperstay.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({ example: '+94771234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must be E.164 format, e.g. +94771234567',
  })
  phone?: string;

  @ApiProperty({ example: 'TempPass!234', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    enum: STAFF_ASSIGNABLE_ROLES,
    example: UserRole.FRONT_DESK,
  })
  @IsIn(STAFF_ASSIGNABLE_ROLES)
  role!: StaffAssignableRole;
}
