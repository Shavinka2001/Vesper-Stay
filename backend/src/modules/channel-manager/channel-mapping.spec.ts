import { BookingSource, ChannelType } from '@generated/prisma/client';
import {
  buildExternalRef,
  channelTypeToBookingSource,
  isOwnFeedEvent,
  OWN_FEED_UID_SUFFIX,
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
