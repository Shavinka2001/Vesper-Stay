'use client';

import { ClipboardList, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookingCard } from '@/components/bookings/BookingCard';
import { CheckInModal } from '@/components/bookings/CheckInModal';
import { CheckOutModal } from '@/components/bookings/CheckOutModal';
import { NewReservationModal } from '@/components/bookings/NewReservationModal';
import { currencySymbol } from '@/components/dashboard/nav-config';
import {
  fetchBookingFolio,
  fetchBookingsList,
  getApiErrorMessage,
} from '@/lib/api';
import type { TimelineBooking } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type StatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT';

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'CHECKED_IN', label: 'Checked In' },
  { id: 'CHECKED_OUT', label: 'Checked Out' },
];

function buildWaMeUrl(phone: string | null | undefined, message: string) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function welcomeMessage(
  booking: TimelineBooking,
  propertyName: string,
): string {
  return [
    `✨ Welcome to ${propertyName}, ${booking.guest.firstName}!`,
    ``,
    `Your sanctuary is ready — Room ${booking.room.number}.`,
    `Confirmation: ${booking.confirmationCode}`,
    ``,
    `📶 Wi-Fi`,
    `Network: VesperStay-Guest`,
    `Password: Welcome@Vesper`,
    ``,
    `Our team is here for anything you need. Wishing you a luminous stay.`,
    `— VesperStay Concierge`,
  ].join('\n');
}

function invoiceMessage(
  booking: TimelineBooking,
  propertyName: string,
  lines: Array<{ label: string; amount: number }>,
  totals: { total: number; paid: number; balance: number },
): string {
  const symbol = currencySymbol(booking.currency);
  const itemLines =
    lines
      .map((l) => `• ${l.label}: ${symbol}${l.amount.toFixed(2)}`)
      .join('\n') || '• Stay charges as agreed';

  return [
    `🧾 Check-out folio — ${propertyName}`,
    `Dear ${booking.guest.firstName},`,
    ``,
    `Room ${booking.room.number} · ${booking.confirmationCode}`,
    ``,
    `Itemized charges:`,
    itemLines,
    ``,
    `Total: ${symbol}${totals.total.toFixed(2)}`,
    `Paid: ${symbol}${totals.paid.toFixed(2)}`,
    `Balance: ${symbol}${totals.balance.toFixed(2)}`,
    ``,
    `Thank you for choosing twilight hospitality with us.`,
    `We would be honoured by your review: https://g.page/r/vesperstay-review`,
    ``,
    `— VesperStay Front Desk`,
  ].join('\n');
}

export default function BookingsPage() {
  const property = useAuthStore((s) => s.property);
  const currency = property?.currency ?? 'USD';
  const propertyName = property?.name ?? 'VesperStay';

  const [bookings, setBookings] = useState<TimelineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [newOpen, setNewOpen] = useState(false);
  const [checkInBooking, setCheckInBooking] = useState<TimelineBooking | null>(
    null,
  );
  const [checkOutBooking, setCheckOutBooking] =
    useState<TimelineBooking | null>(null);
  const [waLoadingId, setWaLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchBookingsList();
      setBookings(list);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to load bookings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      ALL: bookings.length,
      PENDING: 0,
      CONFIRMED: 0,
      CHECKED_IN: 0,
      CHECKED_OUT: 0,
    };
    for (const b of bookings) {
      switch (b.status) {
        case 'PENDING':
        case 'CONFIRMED':
        case 'CHECKED_IN':
        case 'CHECKED_OUT':
          base[b.status] += 1;
          break;
        default:
          break;
      }
    }
    return base;
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        b.confirmationCode,
        b.guest.firstName,
        b.guest.lastName,
        b.guest.phone ?? '',
        b.guest.idPassport ?? '',
        b.guest.country ?? '',
        b.guest.nationality ?? '',
        b.room.number,
        b.room.roomType?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [bookings, query, statusFilter]);

  async function openWhatsApp(booking: TimelineBooking) {
    if (!booking.guest.phone) {
      toast.error('No WhatsApp number on file for this guest');
      return;
    }

    setWaLoadingId(booking.id);
    try {
      if (booking.status === 'CHECKED_OUT' || booking.status === 'CHECKED_IN') {
        try {
          const folio = await fetchBookingFolio(booking.id);
          const message = invoiceMessage(booking, propertyName, folio.lines, {
            total: folio.grandTotal,
            paid: folio.paidAmount,
            balance: folio.balanceDue,
          });
          const url = buildWaMeUrl(booking.guest.phone, message);
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
          else toast.error('Unable to open WhatsApp');
          return;
        } catch {
          // fall through to welcome for in-house if folio fails
          if (booking.status === 'CHECKED_OUT') {
            toast.error('Unable to load folio for invoice message');
            return;
          }
        }
      }

      const message = welcomeMessage(booking, propertyName);
      const url = buildWaMeUrl(booking.guest.phone, message);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else toast.error('Unable to open WhatsApp');
    } finally {
      setWaLoadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Bookings & Guests
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            High-speed front-desk queue — reservations, walk-ins, check-in CRM,
            and folios.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#D4AF37] px-4 text-sm font-semibold text-slate-950 hover:bg-[#C49F27]"
          >
            <Plus className="h-4 w-4" />
            New Reservation / Walk-In
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guest, phone, passport, confirmation…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold uppercase tracking-wide transition',
                statusFilter === f.id
                  ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] tabular-nums',
                  statusFilter === f.id
                    ? 'bg-[#D4AF37]/25'
                    : 'bg-slate-100 dark:bg-slate-800',
                )}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading && bookings.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 text-slate-400 dark:border-slate-700">
          <ClipboardList className="h-8 w-8 opacity-50" />
          <p className="text-sm">No bookings match this filter</p>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-slate-950"
          >
            Create first reservation
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              currency={currency}
              onCheckIn={() => setCheckInBooking(b)}
              onCheckOut={() => setCheckOutBooking(b)}
              onWhatsApp={() => {
                if (waLoadingId === b.id) return;
                void openWhatsApp(b);
              }}
            />
          ))}
        </div>
      )}

      <NewReservationModal
        open={newOpen}
        currency={currency}
        propertyName={propertyName}
        onClose={() => setNewOpen(false)}
        onCreated={() => void load()}
      />
      <CheckInModal
        open={!!checkInBooking}
        booking={checkInBooking}
        currency={currency}
        onClose={() => setCheckInBooking(null)}
        onCompleted={() => void load()}
      />
      <CheckOutModal
        open={!!checkOutBooking}
        booking={checkOutBooking}
        currency={currency}
        onClose={() => setCheckOutBooking(null)}
        onCompleted={() => void load()}
      />
    </div>
  );
}
