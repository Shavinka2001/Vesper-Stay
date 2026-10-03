import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleStaffStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isActive!: boolean;
}
