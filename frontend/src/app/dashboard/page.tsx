'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BedDouble,
  CalendarPlus,
  CircleDollarSign,
  LogIn,
  LogOut,
  Receipt,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  currencySymbol,
  greetingForHour,
} from '@/components/dashboard/nav-config';
import {
  fetchDashboardMetrics,
  fetchRoomStatusCounts,
  fetchTimelineBookings,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import type {
  DashboardMetrics,
  RoomStatusCount,
  TimelineBooking,
} from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';

const EMPTY_METRICS: DashboardMetrics = {
  todaysArrivals: 0,
  todaysDepartures: 0,
  inHouseGuests: 0,
  occupancyRate: 0,
  todaysRevenue: 0,
  occupiedRooms: 0,
  totalRooms: 0,
  asOf: '',
};

const EMPTY_ROOMS: RoomStatusCount = {
  available: 0,
  occupied: 0,
  dirty: 0,
  maintenance: 0,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(amount: number, currency: string): string {
  const symbol = currencySymbol(currency);
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function OccupancyRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[#D4AF37] transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
          {clamped.toFixed(clamped % 1 === 0 ? 0 : 1)}%
        </span>
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { user, property } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);
  const [rooms, setRooms] = useState<RoomStatusCount>(EMPTY_ROOMS);
  const [recent, setRecent] = useState<TimelineBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const currency = property?.currency ?? 'USD';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const day = todayIso();
      const [metricsResult, roomsResult, timelineResult] =
        await Promise.allSettled([
          fetchDashboardMetrics(),
          fetchRoomStatusCounts(),
          fetchTimelineBookings(day, day),
        ]);

      if (cancelled) return;

      if (metricsResult.status === 'fulfilled') {
        setMetrics(metricsResult.value);
      }
      if (roomsResult.status === 'fulfilled') {
        setRooms(roomsResult.value);
      }
      if (timelineResult.status === 'fulfilled') {
        setRecent(timelineResult.value.slice(0, 6));
      }
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const firstName = user.firstName || 'there';
  const propertyName = property?.name ?? 'your property';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 py-6 sm:px-7 sm:py-7 dark:border-slate-800 dark:bg-[#111726]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_0%,rgba(212,175,55,0.12),transparent_55%)]"
        />
        <div className="relative">
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B89428] dark:text-[#D4AF37]">
            <Sparkles className="h-3.5 w-3.5" />
            Live pulse
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
            {greeting}, {firstName} — Here is the pulse for {propertyName}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Arrivals, departures, occupancy, and revenue for today&apos;s
            front-desk operations.
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Occupancy rate
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {loading ? '—' : `${metrics.occupancyRate}%`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.occupiedRooms}/{metrics.totalRooms || '—'} rooms
                occupied
              </p>
            </div>
            <OccupancyRing value={loading ? 0 : metrics.occupancyRate} />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
            <LogIn className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today&apos;s arrivals
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {loading ? '—' : metrics.todaysArrivals}
          </p>
          <p className="mt-1 text-xs text-slate-500">Check-ins pending</p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <LogOut className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today&apos;s departures
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {loading ? '—' : metrics.todaysDepartures}
          </p>
          <p className="mt-1 text-xs text-slate-500">Check-outs pending</p>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111726]">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today&apos;s gross revenue
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {loading ? '—' : formatMoney(metrics.todaysRevenue, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{currency} captured today</p>
        </article>
      </section>

      {/* Grid */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#111726]">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Quick actions
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Jump into the most common front-desk workflows.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link
                href="/dashboard/bookings"
                className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-[#D4AF37]/40"
              >
                <CalendarPlus className="mb-3 h-5 w-5 text-[#B89428] dark:text-[#D4AF37]" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  New walk-in booking
                </span>
                <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  Open bookings <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <Link
                href="/dashboard/pos"
                className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-[#D4AF37]/40"
              >
                <UtensilsCrossed className="mb-3 h-5 w-5 text-[#B89428] dark:text-[#D4AF37]" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  New POS order
                </span>
                <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  Restaurant & cabana <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
              <Link
                href="/dashboard/expenses"
                className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-[#D4AF37]/40"
              >
                <Receipt className="mb-3 h-5 w-5 text-[#B89428] dark:text-[#D4AF37]" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Add expense
                </span>
                <span className="mt-1 flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                  Cashflow ledger <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>

          {/* Room status */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#111726]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Live room status
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Housekeeping snapshot across the property.
                </p>
              </div>
              <BedDouble className="h-5 w-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  {
                    label: 'Available',
                    count: rooms.available,
                    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
                  },
                  {
                    label: 'Occupied',
                    count: rooms.occupied,
                    tone: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900',
                  },
                  {
                    label: 'Dirty',
                    count: rooms.dirty,
                    tone: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
                  },
                  {
                    label: 'Maintenance',
                    count: rooms.maintenance,
                    tone: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900',
                  },
                ] as const
              ).map((badge) => (
                <div
                  key={badge.label}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-center',
                    badge.tone,
                  )}
                >
                  <p className="text-2xl font-semibold">
                    {loading ? '—' : badge.count}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider opacity-80">
                    {badge.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-4">
          <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#111726]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Recent activity
              </h3>
              <Link
                href="/dashboard/bookings"
                className="text-xs font-medium text-[#B89428] hover:underline dark:text-[#D4AF37]"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  No bookings on the board yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Create a walk-in to see activity here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((booking) => (
                  <li
                    key={booking.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          Room {booking.room.number}
                          {booking.room.roomType?.name
                            ? ` · ${booking.room.roomType.name}`
                            : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
                        {booking.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {String(booking.checkInDate).slice(0, 10)} →{' '}
                      {String(booking.checkOutDate).slice(0, 10)} ·{' '}
                      {booking.confirmationCode}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
