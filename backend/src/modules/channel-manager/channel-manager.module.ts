import { Module } from '@nestjs/common';
import { ChannelManagerController } from '@modules/channel-manager/channel-manager.controller';
import { ChannelManagerService } from '@modules/channel-manager/channel-manager.service';

@Module({
  controllers: [ChannelManagerController],
  providers: [ChannelManagerService],
  exports: [ChannelManagerService],
})
export class ChannelManagerModule {}
