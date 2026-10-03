/**
 * Folio money math — pure domain logic, decoupled from Prisma and NestJS.
 *
 * Everything here is a pure function: same inputs → same outputs, no I/O, no
 * dates-from-now, no randomness. That is deliberate. The guest's bill is the
 * most correctness-critical thing in the system, so the arithmetic lives on its
 * own where it can be exhaustively unit-tested without a database.
 *
 * Money is held as `number` and rounded to 2 decimals at every boundary via
 * round2() to tame floating-point drift (0.1 + 0.2 !== 0.3). Callers convert
 * Prisma `Decimal` → number once, at the edge, before calling in.
 */

export interface FolioOrderInput {
  id: string;
  /** Order grand total (already tax-inclusive), in the booking currency. */
  totalAmount: number;
  /** Menu item names for the human-readable POS line label. */
  itemNames: string[];
}

export interface FolioComputationInput {
  bookingId: string;
  roomNumber: string;
  /** Date-only values (Prisma @db.Date → midnight UTC) or ISO strings. */
  checkInDate: Date | string;
  checkOutDate: Date | string;
  /** Nightly catalog rate for the room type. */
  baseRate: number;
  /** The amount agreed on the booking (room, possibly inclusive of extras). */
  bookingTotalAmount: number;
  /** Amount already captured against the booking. */
  paidAmount: number;
  orders: FolioOrderInput[];
}

export type FolioLineKind = 'ROOM' | 'POS' | 'OTHER';

export interface FolioLine {
  id: string;
  kind: FolioLineKind;
  label: string;
  amount: number;
}

export interface ComputedFolio {
  nights: number;
  baseRate: number;
  roomCharge: number;
  orderTotal: number;
  lines: FolioLine[];
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Round a monetary value to 2 decimal places (half-up on the scaled integer). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Whole nights between two dates. Floors at 1: a folio always bills at least a
 * single night even if the dates collapsed (the create path already forbids
 * checkout <= checkin, so this is purely defensive).
 */
export function countNights(
  checkIn: Date | string,
  checkOut: Date | string,
): number {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  return Math.max(1, Math.round((end - start) / MS_PER_DAY));
}

/**
 * Build the itemized folio totals.
 *
 * Room charge rule: prefer the "derived" charge (booking total minus POS
 * orders) when it is positive, otherwise fall back to the catalog charge
 * (nights × base rate). This lets a negotiated booking total win over the rack
 * rate while still producing a sane number when no total was captured.
 */
export function computeFolio(input: FolioComputationInput): ComputedFolio {
  const nights = countNights(input.checkInDate, input.checkOutDate);
  const baseRate = input.baseRate;

  const orderTotal = round2(
    input.orders.reduce((sum, order) => sum + order.totalAmount, 0),
  );

  const catalogRoomCharge = round2(nights * baseRate);
  const derivedRoomCharge = round2(input.bookingTotalAmount - orderTotal);
  const roomCharge =
    derivedRoomCharge > 0 ? derivedRoomCharge : catalogRoomCharge;

  const lines: FolioLine[] = [
    {
      id: `room-${input.bookingId}`,
      kind: 'ROOM',
      label: `Room stay · ${input.roomNumber} · ${nights} night${
        nights === 1 ? '' : 's'
      } × ${baseRate}`,
      amount: roomCharge,
    },
    ...input.orders.map(
      (order): FolioLine => ({
        id: order.id,
        kind: 'POS',
        label: `F&B / Cabana · ${order.itemNames.join(', ') || 'Order'}`,
        amount: order.totalAmount,
      }),
    ),
  ];

  const grandTotal = round2(roomCharge + orderTotal);
  const paidAmount = input.paidAmount;
  const balanceDue = Math.max(0, round2(grandTotal - paidAmount));

  return {
    nights,
    baseRate,
    roomCharge,
    orderTotal,
    lines,
    grandTotal,
    paidAmount,
    balanceDue,
  };
}
