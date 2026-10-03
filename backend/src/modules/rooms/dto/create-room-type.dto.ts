import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Deluxe Villa' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Ocean-facing private villa with plunge pool' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 350, description: 'Nightly base price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  maxAdults!: number;

  @ApiPropertyOptional({ example: 2, minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  maxChildren?: number;

  @ApiPropertyOptional({
    example: ['WiFi', 'AC', 'Ocean View'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  amenities?: string[];
}
