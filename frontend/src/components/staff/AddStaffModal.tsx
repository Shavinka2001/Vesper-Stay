'use client';

import { KeyRound, Loader2, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createStaffMemberRequest, getApiErrorMessage } from '@/lib/api';
import type { StaffAssignableRole } from '@/lib/types';
import { cn } from '@/lib/utils';

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

const ROLE_CARDS: Array<{
  role: StaffAssignableRole;
  title: string;
  description: string;
  permissions: string[];
}> = [
  {
    role: 'MANAGER',
    title: 'Manager',
    description: 'Full operations except ownership transfer',
    permissions: [
      'Team & access control',
      'Rates, channels, expenses',
      'Bookings, POS, inventory',
    ],
  },
  {
    role: 'FRONT_DESK',
    title: 'Front Desk',
    description: 'Guest-facing operations desk',
    permissions: [
      'Tape chart & check-in/out',
      'Bookings & guest CRM',
      'Restaurant / Cabana POS',
    ],
  },
  {
    role: 'HOUSEKEEPING',
    title: 'Housekeeping',
    description: 'Room readiness & stock',
    permissions: [
      'Room status updates',
      'Inventory & stock counts',
      'Tape chart (view)',
    ],
  },
];

type AddStaffModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function generateTempPassword(): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return `Vs${out}`;
}

export function AddStaffModal({
  open,
  onClose,
  onCreated,
}: AddStaffModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffAssignableRole>('FRONT_DESK');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRole('FRONT_DESK');
    setPassword(generateTempPassword());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await createStaffMemberRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
      });
      toast.success('Staff member invited successfully!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to invite staff member'));
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
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89428] dark:text-[#D4AF37]">
              Team invite
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Add team member
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
              <label className={labelClass} htmlFor="staff-fn">
                First name
              </label>
              <input
                id="staff-fn"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="staff-ln">
                Last name
              </label>
              <input
                id="staff-ln"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="staff-email">
              Work email
            </label>
            <input
              id="staff-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="name@hotel.com"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="staff-phone">
              Phone
            </label>
            <input
              id="staff-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+94771234567"
            />
          </div>

          <div>
            <p className={labelClass}>Role</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLE_CARDS.map((card) => (
                <button
                  key={card.role}
                  type="button"
                  onClick={() => setRole(card.role)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition',
                    role === card.role
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {card.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                    {card.description}
                  </p>
                  <ul className="mt-2 space-y-0.5">
                    {card.permissions.map((p) => (
                      <li
                        key={p}
                        className="text-[10px] text-slate-400 before:mr-1 before:content-['·']"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="staff-pass">
              Temporary password
            </label>
            <div className="flex gap-2">
              <input
                id="staff-pass"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputClass, 'font-mono text-xs')}
              />
              <button
                type="button"
                onClick={() => setPassword(generateTempPassword())}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Generate
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Invite team member
          </button>
        </form>
      </div>
    </div>
  );
}
