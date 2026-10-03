'use client';

import { ExternalLink, Loader2, MessageCircle, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { currencySymbol } from '@/components/dashboard/nav-config';
import { checkInBookingRequest, getApiErrorMessage } from '@/lib/api';
import type { TimelineBooking } from '@/lib/types';
import { cn } from '@/lib/utils';

const COUNTRY_CODES = [
  { code: '+94', label: 'LK' },
  { code: '+1', label: 'US/CA' },
  { code: '+44', label: 'UK' },
  { code: '+61', label: 'AU' },
  { code: '+971', label: 'AE' },
  { code: '+65', label: 'SG' },
] as const;

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

type CheckInModalProps = {
  open: boolean;
  booking: TimelineBooking | null;
  currency: string;
  onClose: () => void;
  onCompleted: () => void;
};

function splitPhone(phone: string | null | undefined): {
  code: string;
  local: string;
} {
  if (!phone) return { code: '+94', local: '' };
  const match = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
  if (match) {
    return { code: match.code, local: phone.slice(match.code.length) };
  }
  if (phone.startsWith('+')) {
    return { code: '+94', local: phone.replace(/^\+\d{1,3}/, '') };
  }
  return { code: '+94', local: phone };
}

export function CheckInModal({
  open,
  booking,
  currency,
  onClose,
  onCompleted,
}: CheckInModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+94');
  const [localPhone, setLocalPhone] = useState('');
  const [idPassport, setIdPassport] = useState('');
  const [country, setCountry] = useState('');
  const [nationality, setNationality] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [depositAmount, setDepositAmount] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !booking) return;
    setFirstName(booking.guest.firstName);
    setLastName(booking.guest.lastName);
    setEmail(booking.guest.email ?? '');
    const parsed = splitPhone(booking.guest.phone);
    setCountryCode(parsed.code);
    setLocalPhone(parsed.local.replace(/\D/g, ''));
    setIdPassport(booking.guest.idPassport ?? '');
    setCountry(booking.guest.country ?? '');
    setNationality(booking.guest.nationality ?? '');
    setVehicleNumber(booking.guest.vehicleNumber ?? '');
    setDepositAmount('0');
  }, [open, booking]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const e164Phone = useMemo(
    () => `${countryCode}${localPhone.replace(/\D/g, '')}`,
    [countryCode, localPhone],
  );

  const previewMessage = useMemo(() => {
    if (!booking) return '';
    return `✨ Welcome to VesperStay, ${firstName || 'Guest'}!\nYour sanctuary is ready — Room ${booking.room.number}.`;
  }, [booking, firstName]);

  if (!open || !booking) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!/^\+[1-9]\d{7,14}$/.test(e164Phone)) {
      toast.error('Enter a valid WhatsApp number with country code');
      return;
    }
    setLoading(true);
    try {
      const result = await checkInBookingRequest(booking!.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: e164Phone,
        idPassport: idPassport.trim() || undefined,
        country: country.trim() || undefined,
        nationality: nationality.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        depositAmount: Number(depositAmount) || 0,
      });
      toast.success('Check-in complete');
      if (result.whatsapp.waMeUrl) {
        window.open(result.whatsapp.waMeUrl, '_blank', 'noopener,noreferrer');
        toast.info('WhatsApp welcome draft opened');
      }
      onCompleted();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to complete check-in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close backdrop"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89428] dark:text-[#D4AF37]">
              Guest CRM · {booking.confirmationCode}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Check in · {booking.room.number}
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
          className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="ci-fn">
                First name
              </label>
              <input
                id="ci-fn"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ci-ln">
                Last name
              </label>
              <input
                id="ci-ln"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="ci-email">
              Email
            </label>
            <input
              id="ci-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="ci-phone">
              WhatsApp phone
            </label>
            <div className="flex gap-2">
              <select
                aria-label="Country code"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={cn(inputClass, 'w-[7.5rem] shrink-0')}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} {c.code}
                  </option>
                ))}
              </select>
              <input
                id="ci-phone"
                required
                inputMode="tel"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                placeholder="771234567"
                className={inputClass}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{e164Phone}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="ci-id">
                Passport / ID
              </label>
              <input
                id="ci-id"
                value={idPassport}
                onChange={(e) => setIdPassport(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ci-vehicle">
                Vehicle number
              </label>
              <input
                id="ci-vehicle"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="ci-country">
                Country
              </label>
              <input
                id="ci-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ci-nat">
                Nationality
              </label>
              <input
                id="ci-nat"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="ci-deposit">
              Advance deposit ({currencySymbol(currency).trim()})
            </label>
            <input
              id="ci-deposit"
              type="number"
              min={0}
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2.5">
            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A7020] dark:text-[#D4AF37]">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp welcome preview
            </p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {previewMessage}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Complete Check-In & Send WhatsApp Welcome
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </button>
        </form>
      </div>
    </div>
  );
}
