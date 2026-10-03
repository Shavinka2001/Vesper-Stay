import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChannelManagerService } from '@modules/channel-manager/channel-manager.service';

/**
 * Periodically pulls every enabled channel's iCal feed so OTA bookings are
 * blocked locally without anyone pressing "Sync".
 *
 * iCal is poll-based and eventually-consistent — there is always a lag window
 * between an OTA booking and our next pull, so a short interval matters. The
 * default is every 15 minutes; override with CHANNEL_SYNC_CRON (a cron
 * expression) and disable entirely with CHANNEL_SYNC_ENABLED=false (e.g. so
 * only one instance runs the job, or during local dev).
 *
 * The expression is read from the environment at class-definition time because
 * the @Cron decorator needs a static value; changing it requires a restart.
 */
const CRON_EXPRESSION = process.env.CHANNEL_SYNC_CRON || '0 */15 * * * *';

@Injectable()
export class ChannelSyncScheduler {
  private readonly logger = new Logger(ChannelSyncScheduler.name);

  constructor(private readonly channelManager: ChannelManagerService) {}

  @Cron(CRON_EXPRESSION, { name: 'channel-auto-sync' })
  async handleAutoSync(): Promise<void> {
    if (process.env.CHANNEL_SYNC_ENABLED === 'false') {
      return;
    }
    try {
      await this.channelManager.syncAllEnabled();
    } catch (error) {
      // Defensive: syncAllEnabled already isolates per-connection errors, but
      // never let a scheduler tick throw an unhandled rejection.
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Auto-sync tick failed: ${message}`);
    }
  }
}
