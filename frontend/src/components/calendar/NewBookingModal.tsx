'use client';

import { Loader2, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createBookingRequest, getApiErrorMessage } from '@/lib/api';
import { addDays, parseIsoDate, toIsoDate } from '@/lib/calendar-dates';
import { currencySymbol } from '@/components/dashboard/nav-config';
import type { BookingSource, TapeRoom } from '@/lib/types';
import { cn } from '@/lib/utils';

export type NewBookingPrefill = {
  roomId?: string;
  checkInDate?: string;
  checkOutDate?: string;
};

type NewBookingModalProps = {
  open: boolean;
  rooms: TapeRoom[];
  currency: string;
  prefill?: NewBookingPrefill | null;
  onClose: () => void;
  onCreated: () => void;
};

const SOURCES: { value: BookingSource; label: string }[] = [
  { value: 'FRONT_DESK', label: 'Front Desk' },
  { value: 'DIRECT_WEB', label: 'Direct Web' },
  { value: 'AIRBNB', label: 'Airbnb' },
  { value: 'BOOKING_COM', label: 'Booking.com' },
];

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

export function NewBookingModal({
  open,
  rooms,
  currency,
  prefill,
  onClose,
  onCreated,
}: NewBookingModalProps) {
  const [roomId, setRoomId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idPassport, setIdPassport] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [source, setSource] = useState<BookingSource>('FRONT_DESK');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const today = toIsoDate(new Date());
    const inDate = prefill?.checkInDate ?? today;
    const outDefault = toIsoDate(addDays(parseIsoDate(inDate), 1));
    setRoomId(prefill?.roomId ?? rooms[0]?.id ?? '');
    setCheckInDate(inDate);
    setCheckOutDate(prefill?.checkOutDate ?? outDefault);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setIdPassport('');
    setAdultsCount(2);
    setChildrenCount(0);
    setTotalAmount('0');
    setPaidAmount('0');
    setSource('FRONT_DESK');
    setSpecialRequests('');
  }, [open, prefill, rooms]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const symbol = useMemo(() => currencySymbol(currency), [currency]);

  if (!open) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await createBookingRequest({
        roomId,
        guest: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          idPassport: idPassport.trim() || undefined,
        },
        checkInDate,
        checkOutDate,
        adultsCount,
        childrenCount,
        totalAmount: Number(totalAmount) || 0,
        paidAmount: Number(paidAmount) || 0,
        source,
        status: 'CONFIRMED',
        specialRequests: specialRequests.trim() || undefined,
      });
      toast.success('Reservation created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to create reservation'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89428] dark:text-[#D4AF37]">
              Front desk
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              New reservation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        >
          <div>
            <label htmlFor="nb-room" className={labelClass}>
              Room
            </label>
            <select
              id="nb-room"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.isCabana ? 'Cabana' : room.roomTypeName} {room.number} ·{' '}
                  {room.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nb-in" className={labelClass}>
                Check-in
              </label>
              <input
                id="nb-in"
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="nb-out" className={labelClass}>
                Check-out
              </label>
              <input
                id="nb-out"
                type="date"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nb-fn" className={labelClass}>
                First name
              </label>
              <input
                id="nb-fn"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="nb-ln" className={labelClass}>
                Last name
              </label>
              <input
                id="nb-ln"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="nb-email" className={labelClass}>
              Email
            </label>
            <input
              id="nb-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nb-phone" className={labelClass}>
                Phone
              </label>
              <input
                id="nb-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="nb-id" className={labelClass}>
                Passport / ID
              </label>
              <input
                id="nb-id"
                value={idPassport}
                onChange={(e) => setIdPassport(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nb-adults" className={labelClass}>
                Adults
              </label>
              <input
                id="nb-adults"
                type="number"
                min={1}
                max={20}
                required
                value={adultsCount}
                onChange={(e) => setAdultsCount(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="nb-kids" className={labelClass}>
                Children
              </label>
              <input
                id="nb-kids"
                type="number"
                min={0}
                max={20}
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="nb-total" className={labelClass}>
                Total ({symbol.trim()})
              </label>
              <input
                id="nb-total"
                type="number"
                min={0}
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="nb-paid" className={labelClass}>
                Paid ({symbol.trim()})
              </label>
              <input
                id="nb-paid"
                type="number"
                min={0}
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="nb-source" className={labelClass}>
              Source
            </label>
            <select
              id="nb-source"
              value={source}
              onChange={(e) => setSource(e.target.value as BookingSource)}
              className={inputClass}
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nb-notes" className={labelClass}>
              Special requests
            </label>
            <textarea
              id="nb-notes"
              rows={2}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className={cn(inputClass, 'h-auto py-2')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || rooms.length === 0}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 transition hover:bg-[#C49F27] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create reservation'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
