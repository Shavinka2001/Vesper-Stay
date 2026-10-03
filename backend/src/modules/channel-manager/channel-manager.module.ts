import { Module } from '@nestjs/common';
import {
  ChannelIcalController,
  ChannelManagerController,
} from '@modules/channel-manager/channel-manager.controller';
import { ChannelManagerService } from '@modules/channel-manager/channel-manager.service';
import { ChannelSyncScheduler } from '@modules/channel-manager/channel-sync.scheduler';

@Module({
  controllers: [ChannelManagerController, ChannelIcalController],
  providers: [ChannelManagerService, ChannelSyncScheduler],
  exports: [ChannelManagerService],
})
export class ChannelManagerModule {}
