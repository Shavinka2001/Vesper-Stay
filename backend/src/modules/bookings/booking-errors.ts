/**
 * Shared booking error helpers. Lives apart from BookingsService so other
 * modules (e.g. the channel manager) can reuse it without importing the
 * service — which would create a circular module reference.
 */

/**
 * True when an error is the Postgres exclusion-constraint violation raised by
 * the `bookings_no_overlap` constraint (SQLSTATE 23P01). Prisma does not map
 * exclusion violations to a dedicated code, so we match defensively on the
 * SQLSTATE, the meta code, and the constraint name in the message. Pure &
 * side-effect-free so it can be unit-tested without a database.
 */
export function isBookingOverlapConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as {
    code?: string;
    meta?: { code?: string } | null;
    message?: string;
  };
  const message = typeof err.message === 'string' ? err.message : '';
  return (
    err.code === '23P01' ||
    err.meta?.code === '23P01' ||
    message.includes('23P01') ||
    message.includes('bookings_no_overlap')
  );
}
