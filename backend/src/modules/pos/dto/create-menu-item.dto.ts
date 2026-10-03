import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Ceylon Chicken Curry' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: 'Food',
    description: 'Food | Beverages | Cocktails | Minibar',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  category!: string;

  @ApiProperty({ example: 18.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 'Served with basmati rice' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
