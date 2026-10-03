'use client';

import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  createChannelConnectionRequest,
  fetchPhysicalRooms,
  getApiErrorMessage,
} from '@/lib/api';
import type { ChannelType, PhysicalRoom } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const CHANNEL_OPTIONS: Array<{ id: ChannelType; label: string }> = [
  { id: 'AIRBNB', label: 'Airbnb' },
  { id: 'BOOKING_COM', label: 'Booking.com' },
  { id: 'EXPEDIA', label: 'Expedia' },
  { id: 'ICAL', label: 'Other iCal' },
];

export function AddChannelModal({ open, onClose, onCreated }: Props) {
  const [rooms, setRooms] = useState<PhysicalRoom[]>([]);
  const [channelType, setChannelType] = useState<ChannelType>('AIRBNB');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChannelType('AIRBNB');
    setName('');
    setRoomId('');
    setImportUrl('');
    setIsEnabled(true);
    fetchPhysicalRooms()
      .then(setRooms)
      .catch((err) =>
        toast.error(getApiErrorMessage(err, 'Unable to load rooms')),
      );
  }, [open]);

  if (!open) return null;

  async function onSubmit() {
    if (!name.trim()) {
      toast.error('Give this channel a name');
      return;
    }
    if (!roomId) {
      toast.error('Pick which room this calendar maps to');
      return;
    }
    setSaving(true);
    try {
      await createChannelConnectionRequest({
        channelType,
        name: name.trim(),
        roomId,
        iCalImportUrl: importUrl.trim() || undefined,
        isEnabled,
      });
      toast.success('Channel connected');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to connect channel'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-950/55"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Connect a channel
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Sync an Airbnb / Booking.com calendar to one room via iCal.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Channel
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {CHANNEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setChannelType(opt.id)}
                  className={cn(
                    'h-10 rounded-lg border text-sm font-semibold transition',
                    channelType === opt.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Airbnb — Deluxe Cabana 3"
              className={inputClass}
            />
          </Field>

          <Field label="Room">
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.number} · {r.roomTypeName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Import iCal URL (optional)">
            <input
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/…ics"
              className={cn(inputClass, 'font-mono text-xs')}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Paste the OTA&apos;s export link. Leave blank to only publish your
              calendar outward.
            </p>
          </Field>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 dark:border-slate-700">
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Enable syncing
            </span>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#D4AF37]"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => void onSubmit()}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Connect channel
        </button>
      </div>
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
