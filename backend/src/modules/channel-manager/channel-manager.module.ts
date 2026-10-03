import { Module } from '@nestjs/common';
import {
  ChannelIcalController,
  ChannelManagerController,
} from '@modules/channel-manager/channel-manager.controller';
import { ChannelManagerService } from '@modules/channel-manager/channel-manager.service';

@Module({
  controllers: [ChannelManagerController, ChannelIcalController],
  providers: [ChannelManagerService],
  exports: [ChannelManagerService],
})
export class ChannelManagerModule {}
