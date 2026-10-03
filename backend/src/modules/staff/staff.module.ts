import { Module } from '@nestjs/common';
import { StaffController } from '@modules/staff/staff.controller';
import { StaffService } from '@modules/staff/staff.service';

@Module({
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
