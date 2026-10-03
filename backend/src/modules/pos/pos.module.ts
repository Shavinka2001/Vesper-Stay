import { Module } from '@nestjs/common';
import { PosController } from '@modules/pos/pos.controller';
import { PosService } from '@modules/pos/pos.service';

@Module({
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
