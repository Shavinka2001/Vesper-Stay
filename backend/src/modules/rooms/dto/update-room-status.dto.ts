import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RoomStatus } from '@generated/prisma/client';

export class UpdateRoomStatusDto {
  @ApiProperty({
    enum: RoomStatus,
    example: RoomStatus.DIRTY,
    description: 'Housekeeping / maintenance status',
  })
  @IsEnum(RoomStatus)
  status!: RoomStatus;
}
