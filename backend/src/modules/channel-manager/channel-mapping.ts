import { BookingSource, ChannelType } from '@generated/prisma/client';

/** UID suffix we stamp on our own exported events, to detect and skip re-import loops. */
export const OWN_FEED_UID_SUFFIX = '@vesperstay';

/** Map an OTA channel type to the booking source recorded on imported blocks. */
export function channelTypeToBookingSource(
  channelType: ChannelType,
): BookingSource {
  switch (channelType) {
    case ChannelType.BOOKING_COM:
      return BookingSource.BOOKING_COM;
    case ChannelType.AIRBNB:
      return BookingSource.AIRBNB;
    case ChannelType.EXPEDIA:
      return BookingSource.EXPEDIA;
    default:
      return BookingSource.OTHER;
  }
}

/**
 * Stable dedup key for an imported event, scoped to the connection so re-syncs
 * update the same booking and reconciliation can target just this connection.
 */
export function buildExternalRef(connectionId: string, uid: string): string {
  return `ical:${connectionId}:${uid}`;
}

/** True if an event originated from our own export feed (avoid import loops). */
export function isOwnFeedEvent(uid: string): boolean {
  return uid.endsWith(OWN_FEED_UID_SUFFIX);
}
