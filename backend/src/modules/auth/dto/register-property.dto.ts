import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterPropertyDto {
  @ApiProperty({ example: 'Vesper Beach House - Galle' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  propertyName!: string;

  @ApiProperty({
    example: 'vesper-beach-house-galle',
    description: 'URL-safe unique tenant slug (lowercase, hyphens)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug must be lowercase alphanumeric with optional single hyphens',
  })
  slug!: string;

  @ApiProperty({ example: 'galle@vesperstay.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({ example: '+94 91 222 3344' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: '12 Lighthouse Street, Galle Fort' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency!: string;

  @ApiProperty({ example: 'Asia/Colombo', default: 'Asia/Colombo' })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  timezone!: string;

  @ApiProperty({ example: 'Amara' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  ownerFirstName!: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  ownerLastName!: string;

  @ApiProperty({ example: 'amara.silva@vesperstay.com' })
  @IsEmail()
  @MaxLength(255)
  ownerEmail!: string;

  @ApiProperty({
    example: 'Owner@12345',
    minLength: 8,
    description: 'Owner account password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
