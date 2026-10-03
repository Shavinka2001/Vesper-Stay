import type { BookingSource } from '@/lib/types';

export const SOURCE_LEGEND = [
  {
    key: 'DIRECT_WEB' as const,
    label: 'Direct',
    swatch: 'bg-gradient-to-r from-[#D4AF37] to-[#C49F27]',
  },
  {
    key: 'AIRBNB' as const,
    label: 'Airbnb',
    swatch: 'bg-gradient-to-r from-rose-500 to-rose-400',
  },
  {
    key: 'BOOKING_COM' as const,
    label: 'Booking.com',
    swatch: 'bg-gradient-to-r from-blue-700 to-blue-500',
  },
  {
    key: 'FRONT_DESK' as const,
    label: 'Front Desk',
    swatch: 'bg-gradient-to-r from-slate-800 to-slate-600',
  },
] as const;

export function bookingBarClass(source: string): string {
  switch (source as BookingSource) {
    case 'DIRECT_WEB':
    case 'DIRECT':
      return 'bg-gradient-to-r from-[#D4AF37] to-[#C49F27] text-slate-950';
    case 'AIRBNB':
      return 'bg-gradient-to-r from-rose-500 to-rose-400 text-white';
    case 'BOOKING_COM':
      return 'bg-gradient-to-r from-blue-700 to-blue-500 text-white';
    case 'FRONT_DESK':
    case 'WALK_IN':
      return 'bg-gradient-to-r from-[#0B0F17] to-slate-700 text-slate-100';
    default:
      return 'bg-gradient-to-r from-slate-500 to-slate-400 text-white';
  }
}

export function paymentBadge(
  paidAmount: string | number,
  totalAmount: string | number,
): { label: string; tone: string } {
  const paid = Number(paidAmount);
  const total = Number(totalAmount);
  if (total <= 0) {
    return {
      label: 'N/A',
      tone: 'bg-white/20 text-inherit',
    };
  }
  if (paid >= total) {
    return { label: 'Paid', tone: 'bg-emerald-500/25 text-inherit' };
  }
  if (paid > 0) {
    return { label: 'Partial', tone: 'bg-amber-400/30 text-inherit' };
  }
  return { label: 'Unpaid', tone: 'bg-white/20 text-inherit' };
}

export function roomDisplayName(room: {
  number: string;
  isCabana?: boolean;
  roomTypeName?: string;
}): string {
  // Persist the exact label entered by the hotelier (e.g. "Cabana 101").
  return room.number.trim();
}

export function housekeepingPill(status: string): {
  label: string;
  className: string;
} {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Available',
        className:
          'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    case 'DIRTY':
    case 'CLEANING':
      return {
        label: 'Dirty',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    case 'OCCUPIED':
      return {
        label: 'Occupied',
        className: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      };
    case 'MAINTENANCE':
    case 'OUT_OF_ORDER':
      return {
        label: 'Maintenance',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
      };
  }
}
