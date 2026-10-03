import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PosPaymentMethodDto {
  CASH = 'CASH',
  CARD = 'CARD',
  CHARGE_TO_ROOM = 'CHARGE_TO_ROOM',
}

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  menuItemId!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 12.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class CreatePosOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({
    example: 55.0,
    description: 'Grand total including 10% service charge',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount!: number;

  @ApiProperty({ enum: PosPaymentMethodDto })
  @IsEnum(PosPaymentMethodDto)
  paymentMethod!: PosPaymentMethodDto;

  @ApiPropertyOptional({
    description: 'Required when charging to room (active CHECKED_IN booking id)',
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({
    example: 'Cabana 101',
    description: 'Room label for charge-to-room settlement',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  roomNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ example: 'No ice' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
