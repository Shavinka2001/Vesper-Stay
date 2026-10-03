'use client';

import { MessageCircle } from 'lucide-react';
import { currencySymbol } from '@/components/dashboard/nav-config';
import { nightsBetween } from '@/lib/calendar-dates';
import type { TimelineBooking } from '@/lib/types';
import { cn } from '@/lib/utils';

type BookingCardProps = {
  booking: TimelineBooking;
  currency: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onWhatsApp: () => void;
};

const COUNTRY_FLAGS: Record<string, string> = {
  'sri lanka': '🇱🇰',
  lk: '🇱🇰',
  'united kingdom': '🇬🇧',
  uk: '🇬🇧',
  gb: '🇬🇧',
  'united states': '🇺🇸',
  usa: '🇺🇸',
  us: '🇺🇸',
  australia: '🇦🇺',
  au: '🇦🇺',
  india: '🇮🇳',
  in: '🇮🇳',
  'united arab emirates': '🇦🇪',
  uae: '🇦🇪',
  ae: '🇦🇪',
  singapore: '🇸🇬',
  sg: '🇸🇬',
  germany: '🇩🇪',
  france: '🇫🇷',
  canada: '🇨🇦',
};

function flagForGuest(booking: TimelineBooking): string {
  const key = (
    booking.guest.country ??
    booking.guest.nationality ??
    ''
  )
    .trim()
    .toLowerCase();
  if (!key) return '🌐';
  return COUNTRY_FLAGS[key] ?? '🌐';
}

function statusPillClass(status: string): string {
  if (status === 'CONFIRMED' || status === 'PENDING') {
    return 'bg-[#D4AF37]/20 text-[#8A7020] dark:text-[#D4AF37]';
  }
  if (status === 'CHECKED_IN') {
    return 'bg-teal-500/20 text-teal-800 dark:text-teal-300';
  }
  if (status === 'CHECKED_OUT') {
    return 'bg-slate-500/20 text-slate-600 dark:text-slate-300';
  }
  return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

function money(amount: string | number, currency: string): string {
  return `${currencySymbol(currency)}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function paymentLabel(
  paid: string | number,
  total: string | number,
  currency: string,
): { text: string; tone: string } {
  const p = Number(paid);
  const t = Number(total);
  if (t <= 0) {
    return { text: 'Complimentary', tone: 'bg-slate-500/20 text-slate-600' };
  }
  if (p >= t) {
    return {
      text: `Paid: ${money(p, currency)} / Full`,
      tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    };
  }
  if (p > 0) {
    return {
      text: `Pending: ${money(t - p, currency)}`,
      tone: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    };
  }
  return {
    text: `Due: ${money(t, currency)}`,
    tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  };
}

export function BookingCard({
  booking,
  currency,
  onCheckIn,
  onCheckOut,
  onWhatsApp,
}: BookingCardProps) {
  const cur = booking.currency || currency;
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const pay = paymentLabel(booking.paidAmount, booking.totalAmount, cur);
  const canCheckIn =
    booking.status === 'CONFIRMED' || booking.status === 'PENDING';
  const canCheckOut = booking.status === 'CHECKED_IN';
  const roomLabel = `${booking.room.number} · ${booking.room.roomType?.name ?? 'Room'}`;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#D4AF37]/40 dark:border-slate-800 dark:bg-[#111726]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              <span className="mr-1.5" aria-hidden>
                {flagForGuest(booking)}
              </span>
              {booking.guest.firstName} {booking.guest.lastName}
            </h3>
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                statusPillClass(booking.status),
              )}
            >
              {String(booking.status).replaceAll('_', ' ')}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {booking.confirmationCode}
            </span>
            {booking.guest.phone ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                <MessageCircle className="h-3 w-3" />
                {booking.guest.phone}
              </span>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            'rounded-md px-2 py-1 text-[11px] font-semibold',
            pay.tone,
          )}
        >
          {pay.text}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
        <p>
          <span className="text-slate-400">Room · </span>
          {roomLabel}
        </p>
        <p>
          <span className="text-slate-400">Stay · </span>
          {String(booking.checkInDate).slice(0, 10)} →{' '}
          {String(booking.checkOutDate).slice(0, 10)}
          <span className="text-slate-400">
            {' '}
            · {nights} night{nights === 1 ? '' : 's'}
          </span>
        </p>
        <p className="sm:col-span-2">
          <span className="text-slate-400">Total · </span>
          {money(booking.totalAmount, cur)}
          <span className="text-slate-400">
            {' '}
            · Paid {money(booking.paidAmount, cur)}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canCheckIn ? (
          <button
            type="button"
            onClick={onCheckIn}
            className="rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-[#C49F27]"
          >
            Check In
          </button>
        ) : null}
        {canCheckOut ? (
          <button
            type="button"
            onClick={onCheckOut}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-slate-950"
          >
            Check Out & Folio
          </button>
        ) : null}
        <button
          type="button"
          onClick={onWhatsApp}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </button>
      </div>
    </article>
  );
}
