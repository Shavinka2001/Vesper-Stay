import { BookingSource, ChannelType } from '@generated/prisma/client';
import {
  buildExternalRef,
  channelTypeToBookingSource,
  isOwnFeedEvent,
  OWN_FEED_UID_SUFFIX,
  shouldSkipSync,
} from '@modules/channel-manager/channel-mapping';

describe('channelTypeToBookingSource', () => {
  it('maps known OTAs to their booking source', () => {
    expect(channelTypeToBookingSource(ChannelType.BOOKING_COM)).toBe(
      BookingSource.BOOKING_COM,
    );
    expect(channelTypeToBookingSource(ChannelType.AIRBNB)).toBe(
      BookingSource.AIRBNB,
    );
    expect(channelTypeToBookingSource(ChannelType.EXPEDIA)).toBe(
      BookingSource.EXPEDIA,
    );
  });

  it('falls back to OTHER for iCal / unknown channels', () => {
    expect(channelTypeToBookingSource(ChannelType.ICAL)).toBe(
      BookingSource.OTHER,
    );
    expect(channelTypeToBookingSource(ChannelType.OTHER)).toBe(
      BookingSource.OTHER,
    );
  });
});

describe('buildExternalRef', () => {
  it('is stable and scoped to the connection', () => {
    expect(buildExternalRef('conn-1', 'uid-abc')).toBe('ical:conn-1:uid-abc');
  });
});

describe('isOwnFeedEvent', () => {
  it('detects our own exported events', () => {
    expect(isOwnFeedEvent(`VS-ABC123${OWN_FEED_UID_SUFFIX}`)).toBe(true);
  });

  it('treats external OTA uids as importable', () => {
    expect(isOwnFeedEvent('1234567890@airbnb.com')).toBe(false);
  });
});

describe('shouldSkipSync', () => {
  const now = new Date('2026-10-04T10:00:00.000Z');
  const throttle = 60_000; // 60s

  it('never skips when there is no prior sync', () => {
    expect(shouldSkipSync(null, now, throttle)).toBe(false);
  });

  it('skips when the last sync is within the throttle window', () => {
    const recent = new Date(now.getTime() - 30_000); // 30s ago
    expect(shouldSkipSync(recent, now, throttle)).toBe(true);
  });

  it('allows a sync once the throttle window has passed', () => {
    const old = new Date(now.getTime() - 90_000); // 90s ago
    expect(shouldSkipSync(old, now, throttle)).toBe(false);
  });

  it('is safe with an unparseable date', () => {
    expect(shouldSkipSync('not-a-date', now, throttle)).toBe(false);
  });
});
