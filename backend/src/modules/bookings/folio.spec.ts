import {
  computeFolio,
  countNights,
  round2,
  type FolioComputationInput,
} from '@modules/bookings/folio';

/**
 * Money is the most correctness-critical thing in a PMS. These tests pin the
 * folio arithmetic exactly, cover the rounding/edge cases that bite in
 * production, and document one modeling assumption worth a product review.
 */

function makeInput(
  overrides: Partial<FolioComputationInput> = {},
): FolioComputationInput {
  return {
    bookingId: 'bk-1',
    roomNumber: '101',
    checkInDate: '2026-01-10',
    checkOutDate: '2026-01-13', // 3 nights
    baseRate: 100,
    bookingTotalAmount: 300,
    paidAmount: 0,
    orders: [],
    ...overrides,
  };
}

describe('round2', () => {
  it('tames binary floating-point drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3); // 0.30000000000000004 → 0.3
    expect(round2(299.9700000001)).toBe(299.97);
    expect(round2(1.005)).toBe(1); // documents half-up-on-scaled-int behaviour
  });
});

describe('countNights', () => {
  it('counts whole nights between two dates', () => {
    expect(countNights('2026-01-10', '2026-01-13')).toBe(3);
  });

  it('counts a single night', () => {
    expect(countNights('2026-01-10', '2026-01-11')).toBe(1);
  });

  it('floors to 1 when the dates collapse (defensive)', () => {
    expect(countNights('2026-01-10', '2026-01-10')).toBe(1);
  });

  it('floors to 1 for inverted dates rather than returning negative', () => {
    expect(countNights('2026-01-13', '2026-01-10')).toBe(1);
  });

  it('accepts Date objects as well as ISO strings', () => {
    expect(
      countNights(new Date('2026-01-10'), new Date('2026-01-14')),
    ).toBe(4);
  });
});

describe('computeFolio — room charge', () => {
  it('uses the derived charge (booking total − POS) when positive', () => {
    const folio = computeFolio(makeInput({ bookingTotalAmount: 300 }));
    expect(folio.nights).toBe(3);
    expect(folio.roomCharge).toBe(300);
    expect(folio.orderTotal).toBe(0);
    expect(folio.grandTotal).toBe(300);
  });

  it('falls back to the catalog charge (nights × baseRate) when no total captured', () => {
    const folio = computeFolio(
      makeInput({ bookingTotalAmount: 0, baseRate: 150, checkOutDate: '2026-01-12' }),
    );
    expect(folio.nights).toBe(2);
    expect(folio.roomCharge).toBe(300); // 2 × 150, not 0
    expect(folio.grandTotal).toBe(300);
  });

  it('falls back to catalog when derived charge is exactly zero', () => {
    const folio = computeFolio(
      makeInput({
        bookingTotalAmount: 50,
        baseRate: 80,
        checkOutDate: '2026-01-11', // 1 night
        orders: [{ id: 'o1', totalAmount: 50, itemNames: ['Mojito'] }],
      }),
    );
    // derived = 50 − 50 = 0 (not > 0) → catalog 1 × 80
    expect(folio.roomCharge).toBe(80);
  });

  it('handles fractional nightly rates without drift', () => {
    const folio = computeFolio(
      makeInput({ bookingTotalAmount: 0, baseRate: 99.99 }),
    );
    expect(folio.roomCharge).toBe(299.97); // 3 × 99.99
  });
});

describe('computeFolio — POS orders & lines', () => {
  it('always emits the room line first, keyed by booking id', () => {
    const folio = computeFolio(makeInput());
    expect(folio.lines[0]).toMatchObject({
      id: 'room-bk-1',
      kind: 'ROOM',
      amount: 300,
    });
  });

  it('appends one POS line per order with item names in the label', () => {
    const folio = computeFolio(
      makeInput({
        bookingTotalAmount: 350,
        orders: [
          { id: 'o1', totalAmount: 30, itemNames: ['Club Sandwich', 'Latte'] },
          { id: 'o2', totalAmount: 20, itemNames: ['Beer'] },
        ],
      }),
    );
    expect(folio.lines).toHaveLength(3); // room + 2 POS
    expect(folio.lines[1]).toMatchObject({
      id: 'o1',
      kind: 'POS',
      label: 'F&B / Cabana · Club Sandwich, Latte',
      amount: 30,
    });
    expect(folio.lines[2]?.label).toBe('F&B / Cabana · Beer');
    expect(folio.orderTotal).toBe(50);
  });

  it('labels an order with no item names as "Order"', () => {
    const folio = computeFolio(
      makeInput({ orders: [{ id: 'o1', totalAmount: 10, itemNames: [] }] }),
    );
    expect(folio.lines[1]?.label).toBe('F&B / Cabana · Order');
  });

  it('sums order totals with 2-decimal rounding', () => {
    const folio = computeFolio(
      makeInput({
        orders: [
          { id: 'o1', totalAmount: 0.1, itemNames: ['a'] },
          { id: 'o2', totalAmount: 0.2, itemNames: ['b'] },
        ],
      }),
    );
    expect(folio.orderTotal).toBe(0.3); // not 0.30000000000000004
  });
});

describe('computeFolio — grand total & balance due', () => {
  it('grand total = room charge + order total', () => {
    const folio = computeFolio(
      makeInput({
        bookingTotalAmount: 0,
        baseRate: 100,
        orders: [{ id: 'o1', totalAmount: 45.5, itemNames: ['Dinner'] }],
      }),
    );
    expect(folio.roomCharge).toBe(300); // catalog, derived was negative
    expect(folio.orderTotal).toBe(45.5);
    expect(folio.grandTotal).toBe(345.5);
  });

  it('balance due = grand total − paid', () => {
    const folio = computeFolio(makeInput({ paidAmount: 100 }));
    expect(folio.balanceDue).toBe(200);
  });

  it('never returns a negative balance when the guest overpays', () => {
    const folio = computeFolio(makeInput({ paidAmount: 500 }));
    expect(folio.balanceDue).toBe(0);
  });

  it('reports the full grand total as due when nothing is paid', () => {
    const folio = computeFolio(makeInput({ paidAmount: 0 }));
    expect(folio.balanceDue).toBe(folio.grandTotal);
  });
});

describe('computeFolio — label pluralisation', () => {
  it('uses the singular "night" for a one-night stay', () => {
    const folio = computeFolio(makeInput({ checkOutDate: '2026-01-11' }));
    expect(folio.lines[0]?.label).toContain('1 night ×');
  });

  it('uses the plural "nights" otherwise', () => {
    const folio = computeFolio(makeInput());
    expect(folio.lines[0]?.label).toContain('3 nights ×');
  });
});

/**
 * KNOWN MODELING ASSUMPTION (flagged for product review, NOT a passing spec of
 * desired behaviour): the room charge is derived as (bookingTotalAmount − POS).
 * If `bookingTotalAmount` is the ROOM price only and POS orders are added later
 * during the stay, the derivation subtracts POS from the room and the guest is
 * effectively undercharged for those extras. This test documents what the code
 * does TODAY so a future fix is a deliberate, visible change.
 */
describe('computeFolio — documented quirk: POS subtracted from booking total', () => {
  it('derives room = total − POS, so POS added post-booking can shrink the room charge', () => {
    const folio = computeFolio(
      makeInput({
        bookingTotalAmount: 300, // captured as room-only at booking time
        baseRate: 100, // catalog also 3 × 100 = 300
        orders: [{ id: 'o1', totalAmount: 50, itemNames: ['Room service'] }],
      }),
    );
    // derived = 300 − 50 = 250 → room shown as 250, grand = 250 + 50 = 300.
    // The 50 of room service is NOT added on top of the full 300 room price.
    expect(folio.roomCharge).toBe(250);
    expect(folio.grandTotal).toBe(300);
  });
});
