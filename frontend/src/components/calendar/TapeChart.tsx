'use client';

import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useMemo } from 'react';
import type { NewBookingPrefill } from '@/components/calendar/NewBookingModal';
import {
  SOURCE_LEGEND,
  bookingBarClass,
  housekeepingPill,
  paymentBadge,
  roomDisplayName,
} from '@/components/calendar/booking-styles';
import {
  addDays,
  buildDateRange,
  diffDays,
  formatDayLabel,
  formatMonthYear,
  parseIsoDate,
  toIsoDate,
} from '@/lib/calendar-dates';
import type { TapeRoom, TimelineBooking } from '@/lib/types';
import { cn } from '@/lib/utils';

const ROOM_COL_WIDTH = 200;
const CELL_WIDTH = 56;
const ROW_HEIGHT = 64;

export type ViewDays = 14 | 30;

type TapeChartProps = {
  rooms: TapeRoom[];
  bookings: TimelineBooking[];
  rangeStart: Date;
  viewDays: ViewDays;
  loading: boolean;
  error: string | null;
  onRangeStartChange: (date: Date) => void;
  onViewDaysChange: (days: ViewDays) => void;
  onRefresh: () => void;
  onNewReservation: (prefill?: NewBookingPrefill) => void;
  onSelectBooking: (booking: TimelineBooking) => void;
};

function isSameUtcDay(a: Date, b: Date): boolean {
  return toIsoDate(a) === toIsoDate(b);
}

export function TapeChart({
  rooms,
  bookings,
  rangeStart,
  viewDays,
  loading,
  error,
  onRangeStartChange,
  onViewDaysChange,
  onRefresh,
  onNewReservation,
  onSelectBooking,
}: TapeChartProps) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }, []);

  const dates = useMemo(
    () => buildDateRange(rangeStart, viewDays),
    [rangeStart, viewDays],
  );

  const rangeEnd = useMemo(
    () => addDays(rangeStart, viewDays - 1),
    [rangeStart, viewDays],
  );

  const gridWidth = ROOM_COL_WIDTH + dates.length * CELL_WIDTH;

  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, TimelineBooking[]>();
    for (const booking of bookings) {
      const list = map.get(booking.roomId) ?? [];
      list.push(booking);
      map.set(booking.roomId, list);
    }
    return map;
  }, [bookings]);

  function barGeometry(booking: TimelineBooking): {
    left: number;
    width: number;
  } | null {
    const checkIn = parseIsoDate(String(booking.checkInDate).slice(0, 10));
    const checkOut = parseIsoDate(String(booking.checkOutDate).slice(0, 10));
    // Stay nights are [checkIn, checkOut)
    const visibleStart =
      checkIn < rangeStart ? rangeStart : checkIn;
    const visibleEndExclusive =
      checkOut > addDays(rangeEnd, 1) ? addDays(rangeEnd, 1) : checkOut;

    if (visibleEndExclusive <= visibleStart) return null;
    if (visibleStart > rangeEnd) return null;

    const startIndex = diffDays(visibleStart, rangeStart);
    const spanDays = diffDays(visibleEndExclusive, visibleStart);
    if (spanDays <= 0) return null;

    return {
      left: ROOM_COL_WIDTH + startIndex * CELL_WIDTH + 2,
      width: Math.max(spanDays * CELL_WIDTH - 4, CELL_WIDTH - 4),
    };
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111726] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/60">
            <button
              type="button"
              aria-label="Previous range"
              onClick={() =>
                onRangeStartChange(addDays(rangeStart, -viewDays))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onRangeStartChange(today)}
              className="h-9 rounded-lg px-3 text-xs font-semibold uppercase tracking-wider text-slate-700 transition hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next range"
              onClick={() => onRangeStartChange(addDays(rangeStart, viewDays))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {formatMonthYear(rangeStart)}
            </p>
            <p className="text-xs text-slate-500">
              {toIsoDate(rangeStart)} → {toIsoDate(rangeEnd)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
            {([14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onViewDaysChange(days)}
                className={cn(
                  'h-9 rounded-lg px-3 text-xs font-semibold transition',
                  viewDays === days
                    ? 'bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
                )}
              >
                {days} Days
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNewReservation()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#D4AF37] px-3.5 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-[#C49F27]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Reservation
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {SOURCE_LEGEND.map((item) => (
          <span
            key={item.key}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
          >
            <span className={cn('h-2.5 w-2.5 rounded-sm', item.swatch)} />
            {item.label}
          </span>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0F17] shadow-xl shadow-slate-900/10">
        <div className="overflow-x-auto overflow-y-auto max-h-[min(70vh,720px)] no-scrollbar">
          <div style={{ minWidth: gridWidth }} className="relative">
            {/* Date header */}
            <div
              className="sticky top-0 z-20 flex border-b border-slate-800 bg-[#0E1420]"
              style={{ height: 56 }}
            >
              <div
                className="sticky left-0 z-30 flex shrink-0 items-center border-r border-slate-800 bg-[#0E1420] px-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                style={{ width: ROOM_COL_WIDTH }}
              >
                Rooms
              </div>
              {dates.map((date) => {
                const label = formatDayLabel(date);
                const isToday = isSameUtcDay(date, today);
                return (
                  <div
                    key={toIsoDate(date)}
                    className={cn(
                      'flex shrink-0 flex-col items-center justify-center border-r border-slate-800/80',
                      isToday && 'bg-[#D4AF37]/10',
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wide',
                        isToday ? 'text-[#D4AF37]' : 'text-slate-500',
                      )}
                    >
                      {label.weekday}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                        isToday
                          ? 'bg-[#D4AF37] text-slate-950'
                          : 'text-slate-200',
                      )}
                    >
                      {label.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Body */}
            {loading && rooms.length === 0 ? (
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex border-b border-slate-800/60"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="sticky left-0 z-10 animate-pulse border-r border-slate-800 bg-[#0B0F17] px-3 py-2"
                      style={{ width: ROOM_COL_WIDTH }}
                    >
                      <div className="mb-2 h-3 w-28 rounded bg-slate-800" />
                      <div className="h-3 w-16 rounded bg-slate-800/70" />
                    </div>
                    <div className="flex-1 animate-pulse bg-slate-900/40" />
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex h-40 items-center justify-center px-6 text-sm text-slate-500">
                No rooms found for this property. Add inventory in Settings.
              </div>
            ) : (
              rooms.map((room) => {
                const hk = housekeepingPill(String(room.status));
                const roomBookings = bookingsByRoom.get(room.id) ?? [];

                return (
                  <div
                    key={room.id}
                    className="relative flex border-b border-slate-800/70"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Sticky room column */}
                    <div
                      className="sticky left-0 z-10 flex shrink-0 flex-col justify-center gap-1 border-r border-slate-800 bg-[#0B0F17] px-3"
                      style={{ width: ROOM_COL_WIDTH }}
                    >
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {roomDisplayName(room)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                          {room.roomTypeName}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                            hk.className,
                          )}
                        >
                          {hk.label}
                        </span>
                      </div>
                    </div>

                    {/* Day cells */}
                    {dates.map((date) => {
                      const iso = toIsoDate(date);
                      const isToday = isSameUtcDay(date, today);
                      return (
                        <button
                          key={`${room.id}-${iso}`}
                          type="button"
                          onClick={() =>
                            onNewReservation({
                              roomId: room.id,
                              checkInDate: iso,
                            })
                          }
                          className={cn(
                            'shrink-0 border-r border-slate-800/50 transition hover:bg-slate-800/40',
                            isToday && 'bg-[rgba(212,175,55,0.06)]',
                          )}
                          style={{ width: CELL_WIDTH, height: ROW_HEIGHT }}
                          aria-label={`New booking ${roomDisplayName(room)} on ${iso}`}
                        />
                      );
                    })}

                    {/* Booking bars */}
                    {roomBookings.map((booking) => {
                      const geo = barGeometry(booking);
                      if (!geo) return null;
                      const pay = paymentBadge(
                        booking.paidAmount,
                        booking.totalAmount,
                      );
                      const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`.trim();

                      return (
                        <button
                          key={booking.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(booking);
                          }}
                          className={cn(
                            'absolute top-2 z-[5] flex h-12 items-center gap-2 overflow-hidden rounded-lg px-2.5 text-left shadow-md transition hover:brightness-110 hover:ring-2 hover:ring-white/30',
                            bookingBarClass(booking.source),
                          )}
                          style={{
                            left: geo.left,
                            width: geo.width,
                          }}
                          title={`${guestName} · ${booking.confirmationCode}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold leading-tight">
                              {guestName}
                            </p>
                            <p className="truncate text-[10px] opacity-90">
                              {booking.adults}A
                              {booking.children > 0
                                ? ` · ${booking.children}K`
                                : ''}
                            </p>
                          </div>
                          {geo.width >= 88 ? (
                            <span
                              className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                pay.tone,
                              )}
                            >
                              {pay.label}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
