'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BookingDetailsDrawer } from '@/components/calendar/BookingDetailsDrawer';
import {
  NewBookingModal,
  type NewBookingPrefill,
} from '@/components/calendar/NewBookingModal';
import { TapeChart, type ViewDays } from '@/components/calendar/TapeChart';
import {
  fetchTapeRooms,
  fetchTimelineBookings,
  getApiErrorMessage,
} from '@/lib/api';
import { addDays, startOfUtcDay, toIsoDate } from '@/lib/calendar-dates';
import type { TapeRoom, TimelineBooking } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';

export default function CalendarPage() {
  const property = useAuthStore((s) => s.property);
  const currency = property?.currency ?? 'USD';

  const [rangeStart, setRangeStart] = useState(() => startOfUtcDay());
  const [viewDays, setViewDays] = useState<ViewDays>(14);
  const [rooms, setRooms] = useState<TapeRoom[]>([]);
  const [bookings, setBookings] = useState<TimelineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [prefill, setPrefill] = useState<NewBookingPrefill | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<TimelineBooking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = toIsoDate(rangeStart);
    const end = toIsoDate(addDays(rangeStart, viewDays - 1));

    try {
      const [roomList, timeline] = await Promise.all([
        fetchTapeRooms(),
        fetchTimelineBookings(start, end),
      ]);
      setRooms(roomList);
      setBookings(timeline);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to load tape chart');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [rangeStart, viewDays]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew(next?: NewBookingPrefill) {
    setPrefill(next ?? null);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Tape Chart
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Visual front-desk calendar for {property?.name ?? 'your property'} —
          click an empty cell to book, or a bar to manage the stay.
        </p>
      </div>

      <TapeChart
        rooms={rooms}
        bookings={bookings}
        rangeStart={rangeStart}
        viewDays={viewDays}
        loading={loading}
        error={error}
        onRangeStartChange={setRangeStart}
        onViewDaysChange={setViewDays}
        onRefresh={() => void load()}
        onNewReservation={openNew}
        onSelectBooking={setSelectedBooking}
      />

      <NewBookingModal
        open={modalOpen}
        rooms={rooms}
        currency={currency}
        prefill={prefill}
        onClose={() => setModalOpen(false)}
        onCreated={() => void load()}
      />

      <BookingDetailsDrawer
        booking={selectedBooking}
        currency={currency}
        onClose={() => setSelectedBooking(null)}
        onUpdated={() => void load()}
      />
    </div>
  );
}
