'use client';

import { Loader2, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createRoomRequest, getApiErrorMessage } from '@/lib/api';
import type { RoomTypeRecord } from '@/lib/types';

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

type AddRoomModalProps = {
  open: boolean;
  roomTypes: RoomTypeRecord[];
  onClose: () => void;
  onCreated: () => void;
};

export function AddRoomModal({
  open,
  roomTypes,
  onClose,
  onCreated,
}: AddRoomModalProps) {
  const [roomTypeId, setRoomTypeId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRoomTypeId(roomTypes[0]?.id ?? '');
    setRoomNumber('');
    setFloor('');
  }, [open, roomTypes]);

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
      const selected = roomTypes.find((t) => t.id === roomTypeId);
      await createRoomRequest({
        roomTypeId,
        roomNumber: roomNumber.trim(),
        floor: floor.trim() || undefined,
        isCabana: selected?.name.toLowerCase().includes('cabana'),
      });
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to create room'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close backdrop"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89428] dark:text-[#D4AF37]">
              Inventory
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Add room / cabana
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

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
          {roomTypes.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Create a room type first, then add physical rooms.
            </p>
          ) : null}

          <div>
            <label htmlFor="ar-type" className={labelClass}>
              Room type
            </label>
            <select
              id="ar-type"
              required
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              disabled={roomTypes.length === 0}
              className={inputClass}
            >
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ar-number" className={labelClass}>
              Room / cabana number
            </label>
            <input
              id="ar-number"
              required
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder='e.g. "Villa 101" or "Cabana 04"'
              className={inputClass}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              This label appears as-is on the tape chart.
            </p>
          </div>

          <div>
            <label htmlFor="ar-floor" className={labelClass}>
              Floor / zone
            </label>
            <input
              id="ar-floor"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Ground · Ocean Wing"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading || roomTypes.length === 0}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create room
          </button>
        </form>
      </div>
    </div>
  );
}
