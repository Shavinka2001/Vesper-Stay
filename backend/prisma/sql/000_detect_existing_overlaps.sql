-- Pre-flight check — run this BEFORE applying 001_booking_no_overlap_exclusion.sql.
-- Adding the EXCLUDE constraint will FAIL if any active bookings already overlap.
-- This lists every offending pair so you can resolve them first (cancel one,
-- move a room, or fix bad dates). Expect ZERO rows on a clean dataset.
--
-- Run with:  npm run db:detect-overlaps

SELECT
  a."id"            AS booking_a,
  a."confirmationCode" AS code_a,
  b."id"            AS booking_b,
  b."confirmationCode" AS code_b,
  a."roomId",
  a."checkInDate"   AS a_check_in,
  a."checkOutDate"  AS a_check_out,
  b."checkInDate"   AS b_check_in,
  b."checkOutDate"  AS b_check_out
FROM "bookings" a
JOIN "bookings" b
  ON a."roomId" = b."roomId"
 AND a."id" < b."id"                       -- each pair once, no self-match
 AND daterange(a."checkInDate", a."checkOutDate", '[)')
     && daterange(b."checkInDate", b."checkOutDate", '[)')
WHERE a."status" IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
  AND b."status" IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
ORDER BY a."roomId", a."checkInDate";
