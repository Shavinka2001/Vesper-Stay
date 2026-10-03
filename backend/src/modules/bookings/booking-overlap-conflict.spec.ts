import { isBookingOverlapConflict } from '@modules/bookings/bookings.service';

/**
 * The bookings_no_overlap EXCLUDE constraint surfaces through Prisma in a few
 * different shapes depending on version / driver. This pins that every shape is
 * recognised, so the race-loser always gets a clean 409 instead of a 500.
 */
describe('isBookingOverlapConflict', () => {
  it('matches a raw SQLSTATE 23P01 on the error code', () => {
    expect(isBookingOverlapConflict({ code: '23P01' })).toBe(true);
  });

  it('matches the SQLSTATE nested in meta (Prisma known error)', () => {
    expect(
      isBookingOverlapConflict({ code: 'P2010', meta: { code: '23P01' } }),
    ).toBe(true);
  });

  it('matches the constraint name in the raw message', () => {
    expect(
      isBookingOverlapConflict({
        message:
          'conflicting key value violates exclusion constraint "bookings_no_overlap"',
      }),
    ).toBe(true);
  });

  it('matches the SQLSTATE embedded in the message text', () => {
    expect(
      isBookingOverlapConflict({ message: 'db error: 23P01 exclusion_violation' }),
    ).toBe(true);
  });

  it('does NOT match unrelated errors', () => {
    expect(isBookingOverlapConflict({ code: 'P2002' })).toBe(false);
    expect(isBookingOverlapConflict({ message: 'connection refused' })).toBe(
      false,
    );
  });

  it('is safe on null / non-object inputs', () => {
    expect(isBookingOverlapConflict(null)).toBe(false);
    expect(isBookingOverlapConflict(undefined)).toBe(false);
    expect(isBookingOverlapConflict('23P01')).toBe(false);
  });
});
