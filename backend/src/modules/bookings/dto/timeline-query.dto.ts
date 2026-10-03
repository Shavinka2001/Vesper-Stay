import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class TimelineQueryDto {
  @ApiProperty({
    example: '2026-09-01',
    description: 'Inclusive timeline window start (YYYY-MM-DD)',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2026-09-30',
    description: 'Inclusive timeline window end (YYYY-MM-DD)',
  })
  @IsDateString()
  endDate!: string;
}
