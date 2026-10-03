'use client';

import {
  CalendarRange,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckInModal } from '@/components/bookings/CheckInModal';
import { CheckOutModal } from '@/components/bookings/CheckOutModal';
import {
  bookingBarClass,
  paymentBadge,
} from '@/components/calendar/booking-styles';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { currencySymbol } from '@/components/dashboard/nav-config';
import { getApiErrorMessage, updateBookingStatusRequest } from '@/lib/api';
import { nightsBetween } from '@/lib/calendar-dates';
import type { TimelineBooking, UpdateBookingStatusPayload } from '@/lib/types';
import { cn } from '@/lib/utils';

type BookingDetailsDrawerProps = {
  booking: TimelineBooking | null;
  currency: string;
  onClose: () => void;
  onUpdated: () => void;
};

function formatMoney(amount: string | number, currency: string): string {
  return `${currencySymbol(currency)}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function BookingDetailsDrawer({
  booking,
  currency,
  onClose,
  onUpdated,
}: BookingDetailsDrawerProps) {
  const [loadingAction, setLoadingAction] =
    useState<UpdateBookingStatusPayload['status'] | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  useEffect(() => {
    if (!booking) {
      setCheckInOpen(false);
      setCheckOutOpen(false);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !checkInOpen && !checkOutOpen) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [booking, onClose, checkInOpen, checkOutOpen]);

  if (!booking) return null;

  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate);
  const pay = paymentBadge(booking.paidAmount, booking.totalAmount);
  const status = booking.status;
  const canCheckIn = status === 'CONFIRMED' || status === 'PENDING';
  const canCheckOut = status === 'CHECKED_IN';
  const canCancel =
    status !== 'CANCELLED' && status !== 'CHECKED_OUT' && status !== 'NO_SHOW';

  async function runCancel() {
    setLoadingAction('CANCELLED');
    try {
      await updateBookingStatusRequest(booking!.id, { status: 'CANCELLED' });
      toast.success('Booking cancelled');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to cancel booking'));
    } finally {
      setLoadingAction(null);
      setConfirmCancel(false);
    }
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirmCancel}
        title="Cancel this booking?"
        description="The reservation will be cancelled and the room freed for new stays."
        confirmText="Cancel booking"
        cancelText="Keep booking"
        isDestructive
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => void runCancel()}
      />

      <CheckInModal
        open={checkInOpen}
        booking={booking}
        currency={currency}
        onClose={() => setCheckInOpen(false)}
        onCompleted={() => {
          onUpdated();
          onClose();
        }}
      />

      <CheckOutModal
        open={checkOutOpen}
        booking={booking}
        currency={currency}
        onClose={() => setCheckOutOpen(false)}
        onCompleted={() => {
          onUpdated();
          onClose();
        }}
      />

      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close drawer backdrop"
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
          onClick={onClose}
        />
        <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-[#0B0F17] text-slate-100 shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                Booking · {booking.confirmationCode}
              </p>
              <h2 className="mt-1 truncate text-xl font-semibold">
                {booking.guest.firstName} {booking.guest.lastName}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    bookingBarClass(booking.source),
                  )}
                >
                  {String(booking.source).replaceAll('_', ' ')}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                  {String(status).replaceAll('_', ' ')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <UserRound className="h-3.5 w-3.5" />
                Guest CRM
              </h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span>{booking.guest.email ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>{booking.guest.phone ?? '—'}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500">Passport / ID · </span>
                  {booking.guest.idPassport ?? '—'}
                </div>
                <div className="text-slate-300">
                  <span className="text-slate-500">Country · </span>
                  {booking.guest.country ?? booking.guest.nationality ?? '—'}
                </div>
                {booking.guest.vehicleNumber ? (
                  <div className="text-slate-300">
                    <span className="text-slate-500">Vehicle · </span>
                    {booking.guest.vehicleNumber}
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <CalendarRange className="h-3.5 w-3.5" />
                Stay
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    Room
                  </p>
                  <p className="mt-0.5 font-medium">
                    {booking.room.roomType?.name ?? 'Room'} {booking.room.number}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    Nights
                  </p>
                  <p className="mt-0.5 font-medium">{nights}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    Check-in
                  </p>
                  <p className="mt-0.5 font-medium">
                    {String(booking.checkInDate).slice(0, 10)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    Check-out
                  </p>
                  <p className="mt-0.5 font-medium">
                    {String(booking.checkOutDate).slice(0, 10)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">
                    Guests
                  </p>
                  <p className="mt-0.5 font-medium">
                    {booking.adults} adults
                    {booking.children > 0 ? ` · ${booking.children} kids` : ''}
                  </p>
                </div>
              </div>
              {booking.notes ? (
                <p className="mt-3 rounded-lg bg-slate-950/50 px-3 py-2 text-xs leading-relaxed text-slate-400">
                  {booking.notes}
                </p>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <CreditCard className="h-3.5 w-3.5" />
                Payment
              </h3>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">
                    {formatMoney(
                      booking.paidAmount,
                      booking.currency || currency,
                    )}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      /{' '}
                      {formatMoney(
                        booking.totalAmount,
                        booking.currency || currency,
                      )}
                    </span>
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-100',
                    pay.tone,
                  )}
                >
                  {pay.label}
                </span>
              </div>
            </section>
          </div>

          <div className="space-y-2 border-t border-slate-800 p-4">
            {canCheckIn ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => setCheckInOpen(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
              >
                Check In
              </button>
            ) : null}
            {canCheckOut ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => setCheckOutOpen(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-100 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
              >
                Check Out
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                disabled={loadingAction !== null}
                onClick={() => setConfirmCancel(true)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-rose-900/80 bg-rose-950/30 text-sm font-medium text-rose-300 hover:bg-rose-950/50 disabled:opacity-60"
              >
                {loadingAction === 'CANCELLED' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Cancel Booking
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
