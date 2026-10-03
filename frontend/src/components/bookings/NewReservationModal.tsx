'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Sparkles, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { currencySymbol } from '@/components/dashboard/nav-config';
import {
  createBookingRequest,
  fetchTapeRooms,
  getApiErrorMessage,
} from '@/lib/api';
import {
  addDays,
  nightsBetween,
  parseIsoDate,
  toIsoDate,
} from '@/lib/calendar-dates';
import type { TapeRoom } from '@/lib/types';
import { cn } from '@/lib/utils';

const COUNTRY_CODES = [
  { code: '+94', label: 'LK', flag: '🇱🇰' },
  { code: '+1', label: 'US', flag: '🇺🇸' },
  { code: '+44', label: 'UK', flag: '🇬🇧' },
  { code: '+61', label: 'AU', flag: '🇦🇺' },
  { code: '+971', label: 'AE', flag: '🇦🇪' },
  { code: '+65', label: 'SG', flag: '🇸🇬' },
  { code: '+91', label: 'IN', flag: '🇮🇳' },
] as const;

const PAYMENT_METHODS = [
  { value: 'CASH' as const, label: 'Cash' },
  { value: 'CARD' as const, label: 'Stripe Card' },
  { value: 'BANK_TRANSFER' as const, label: 'Bank Transfer' },
];

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

type NewReservationModalProps = {
  open: boolean;
  currency: string;
  propertyName?: string | null;
  onClose: () => void;
  onCreated: () => void;
};

export function NewReservationModal({
  open,
  currency,
  propertyName,
  onClose,
  onCreated,
}: NewReservationModalProps) {
  const [rooms, setRooms] = useState<TapeRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+94');
  const [localPhone, setLocalPhone] = useState('');
  const [idPassport, setIdPassport] = useState('');
  const [country, setCountry] = useState('');
  const [nationality, setNationality] = useState('');
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>(
    'CASH',
  );
  const [instantCheckIn, setInstantCheckIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const today = toIsoDate(new Date());
    setFirstName('');
    setLastName('');
    setCountryCode('+94');
    setLocalPhone('');
    setIdPassport('');
    setCountry('');
    setNationality('');
    setEmail('');
    setCheckInDate(today);
    setCheckOutDate(toIsoDate(addDays(parseIsoDate(today), 1)));
    setAdults(2);
    setChildren(0);
    setPaidAmount('0');
    setPaymentMethod('CASH');
    setInstantCheckIn(false);
    setRoomId('');

    let cancelled = false;
    async function loadRooms() {
      setRoomsLoading(true);
      try {
        const list = await fetchTapeRooms();
        if (cancelled) return;
        setRooms(list);
        const preferred =
          list.find((r) => r.status === 'AVAILABLE') ?? list[0];
        setRoomId(preferred?.id ?? '');
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Unable to load rooms'));
      } finally {
        if (!cancelled) setRoomsLoading(false);
      }
    }
    void loadRooms();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === roomId) ?? null,
    [rooms, roomId],
  );

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1;
    try {
      return nightsBetween(checkInDate, checkOutDate);
    } catch {
      return 1;
    }
  }, [checkInDate, checkOutDate]);

  const baseRate = Number(selectedRoom?.baseRate ?? 0);
  const totalAmount = Math.round(nights * baseRate * 100) / 100;
  const symbol = currencySymbol(currency);
  const e164Phone = `${countryCode}${localPhone.replace(/\D/g, '')}`;

  const roomOptions = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aAvail = a.status === 'AVAILABLE' ? 0 : 1;
      const bAvail = b.status === 'AVAILABLE' ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      return a.number.localeCompare(b.number);
    });
  }, [rooms]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!roomId) {
      toast.error('Select a room');
      return;
    }
    if (localPhone && !/^\+[1-9]\d{7,14}$/.test(e164Phone)) {
      toast.error('Enter a valid WhatsApp number with country code');
      return;
    }
    if (nights < 1 || checkOutDate <= checkInDate) {
      toast.error('Check-out must be after check-in');
      return;
    }

    setLoading(true);
    try {
      const result = await createBookingRequest({
        roomId,
        guest: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: localPhone ? e164Phone : undefined,
          email: email.trim() || undefined,
          idPassport: idPassport.trim() || undefined,
          country: country.trim() || undefined,
          nationality: nationality.trim() || country.trim() || undefined,
        },
        checkInDate,
        checkOutDate,
        adultsCount: Number(adults) || 2,
        childrenCount: Number(children) || 0,
        totalAmount: Number(totalAmount) || 0,
        paidAmount: Number(paidAmount) || 0,
        paymentMethod,
        source: 'FRONT_DESK',
        status: instantCheckIn ? 'CHECKED_IN' : 'CONFIRMED',
        instantCheckIn,
      });

      toast.success('Reservation created successfully!');
      if (result.whatsapp?.waMeUrl) {
        window.open(result.whatsapp.waMeUrl, '_blank', 'noopener,noreferrer');
        toast.info('WhatsApp welcome draft opened');
      }
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to create reservation'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Close backdrop"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative z-10 flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89428] dark:text-[#D4AF37]">
                  Front desk · {propertyName ?? 'VesperStay'}
                </p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  New Reservation / Walk-In
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex-1 space-y-5 overflow-y-auto px-5 py-4"
            >
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  1 · Guest information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="nr-fn">
                      First name
                    </label>
                    <input
                      id="nr-fn"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="nr-ln">
                      Last name
                    </label>
                    <input
                      id="nr-ln"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="nr-phone">
                    WhatsApp phone
                  </label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Country code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className={cn(inputClass, 'w-[8.5rem] shrink-0')}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.label} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      id="nr-phone"
                      inputMode="tel"
                      value={localPhone}
                      onChange={(e) => setLocalPhone(e.target.value)}
                      placeholder="771234567"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="nr-id">
                      Passport / NIC
                    </label>
                    <input
                      id="nr-id"
                      value={idPassport}
                      onChange={(e) => setIdPassport(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="nr-country">
                      Country / Nationality
                    </label>
                    <input
                      id="nr-country"
                      value={country || nationality}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setNationality(e.target.value);
                      }}
                      className={inputClass}
                      placeholder="Sri Lanka"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="nr-email">
                    Email (optional)
                  </label>
                  <input
                    id="nr-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  2 · Room & dates
                </h3>
                <div>
                  <label className={labelClass} htmlFor="nr-room">
                    Room
                  </label>
                  <select
                    id="nr-room"
                    required
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={roomsLoading}
                    className={inputClass}
                  >
                    {roomsLoading ? (
                      <option>Loading rooms…</option>
                    ) : roomOptions.length === 0 ? (
                      <option value="">No rooms configured</option>
                    ) : (
                      roomOptions.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.number} — {room.roomTypeName} ({symbol}
                          {Number(room.baseRate ?? 0).toLocaleString()}/night)
                          {room.status !== 'AVAILABLE'
                            ? ` · ${room.status}`
                            : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="nr-in">
                      Check-in
                    </label>
                    <input
                      id="nr-in"
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCheckInDate(next);
                        if (checkOutDate && checkOutDate <= next) {
                          setCheckOutDate(
                            toIsoDate(addDays(parseIsoDate(next), 1)),
                          );
                        }
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="nr-out">
                      Check-out
                    </label>
                    <input
                      id="nr-out"
                      type="date"
                      required
                      value={checkOutDate}
                      min={checkInDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {nights} night{nights === 1 ? '' : 's'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="nr-adults">
                      Adults
                    </label>
                    <input
                      id="nr-adults"
                      type="number"
                      min={1}
                      max={20}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value) || 1)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="nr-kids">
                      Children
                    </label>
                    <input
                      id="nr-kids"
                      type="number"
                      min={0}
                      max={20}
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  3 · Billing
                </h3>
                <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A7020] dark:text-[#D4AF37]">
                    Total amount
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {symbol}
                    {totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {nights} × {symbol}
                    {baseRate.toLocaleString()} base rate
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="nr-paid">
                      Advance paid ({symbol.trim()})
                    </label>
                    <input
                      id="nr-paid"
                      type="number"
                      min={0}
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <span className={labelClass}>Payment method</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setPaymentMethod(m.value)}
                          className={cn(
                            'h-9 rounded-lg border text-xs font-semibold transition',
                            paymentMethod === m.value
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                              : 'border-slate-300 text-slate-500 dark:border-slate-700',
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                <input
                  type="checkbox"
                  checked={instantCheckIn}
                  onChange={(e) => setInstantCheckIn(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                    Instant Walk-In Check-In
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Sets status to Checked In, room to Occupied, and opens
                    WhatsApp welcome.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || roomsLoading || !roomId}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {instantCheckIn
                  ? 'Create & Check In'
                  : 'Create Reservation'}
              </button>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
