import { Module } from '@nestjs/common';
import { RoomsController } from '@modules/rooms/rooms.controller';
import { RoomsService } from '@modules/rooms/rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
