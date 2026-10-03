-- VesperStay — database-level double-booking prevention
-- ---------------------------------------------------------------------------
-- Guarantees that no two ACTIVE bookings (PENDING / CONFIRMED / CHECKED_IN)
-- can occupy the same room over an overlapping date range. This is the
-- race-safe backstop behind the application-layer overlap check: even under
-- perfect concurrency, retries, or an app bug, PostgreSQL will reject the
-- second overlapping insert atomically.
--
-- Interval semantics: daterange(checkIn, checkOut, '[)') is half-open — the
-- checkout day itself is free for the next guest to check in, which matches
-- the app's overlap logic (checkIn < otherCheckOut AND checkOut > otherCheckIn).
--
-- Idempotent: safe to run more than once (db-push workflow, no migration
-- history). Apply with:  npm run db:constraints
-- ---------------------------------------------------------------------------

-- btree_gist lets a GiST index mix scalar equality ("roomId" WITH =) with the
-- range overlap operator (daterange WITH &&) in a single EXCLUDE constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    RAISE NOTICE 'Constraint bookings_no_overlap already exists — skipping.';
    RETURN;
  END IF;

  ALTER TABLE "bookings"
    ADD CONSTRAINT "bookings_no_overlap"
    EXCLUDE USING gist (
      "roomId" WITH =,
      daterange("checkInDate", "checkOutDate", '[)') WITH &&
    )
    WHERE ("status" IN ('PENDING', 'CONFIRMED', 'CHECKED_IN'));

  RAISE NOTICE 'Constraint bookings_no_overlap created.';
END
$$;
