import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRoomTypeDto } from '@modules/rooms/dto/create-room-type.dto';

export class UpdateRoomTypeDto extends PartialType(CreateRoomTypeDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
