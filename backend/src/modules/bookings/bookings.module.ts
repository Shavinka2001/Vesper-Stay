import { Module } from '@nestjs/common';
import { BookingsController } from '@modules/bookings/bookings.controller';
import { BookingsService } from '@modules/bookings/bookings.service';
import { ChannelManagerModule } from '@modules/channel-manager/channel-manager.module';
import { WhatsAppModule } from '@modules/whatsapp/whatsapp.module';

@Module({
  imports: [WhatsAppModule, ChannelManagerModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
