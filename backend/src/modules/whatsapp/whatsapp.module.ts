import { Module } from '@nestjs/common';
import { WhatsAppService } from '@modules/whatsapp/whatsapp.service';

@Module({
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
