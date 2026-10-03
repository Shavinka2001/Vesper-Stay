import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CheckInDto {
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

  @ApiPropertyOptional({ example: 'amara@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    example: '+94771234567',
    description: 'WhatsApp number in E.164 format with country code',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'phone must be E.164 format, e.g. +94771234567',
  })
  phone!: string;

  @ApiPropertyOptional({ example: 'N1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  idPassport?: string;

  @ApiPropertyOptional({ example: 'Sri Lanka' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: 'Sri Lankan' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nationality?: string;

  @ApiPropertyOptional({ example: 'WP CAA-1234' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  vehicleNumber?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Advance deposit collected at check-in',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;
}
