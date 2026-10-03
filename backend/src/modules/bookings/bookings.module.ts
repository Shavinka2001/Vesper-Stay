import { Module } from '@nestjs/common';
import { BookingsController } from '@modules/bookings/bookings.controller';
import { BookingsService } from '@modules/bookings/bookings.service';
import { WhatsAppModule } from '@modules/whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
