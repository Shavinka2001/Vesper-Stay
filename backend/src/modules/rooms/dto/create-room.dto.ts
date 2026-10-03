import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoomStatus } from '@generated/prisma/client';

export class CreateRoomDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Room type this inventory unit belongs to',
  })
  @IsUUID()
  roomTypeId!: string;

  @ApiProperty({
    example: 'Villa 101',
    description: 'Property-unique room / cabana label or number',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  roomNumber!: string;

  @ApiPropertyOptional({ example: 'Ground / Ocean Wing' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  floor?: string;

  @ApiPropertyOptional({ enum: RoomStatus, default: RoomStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({ example: 'Ocean-facing corner suite' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'True when this unit is a pool/beach cabana',
  })
  @IsOptional()
  @IsBoolean()
  isCabana?: boolean;
}
