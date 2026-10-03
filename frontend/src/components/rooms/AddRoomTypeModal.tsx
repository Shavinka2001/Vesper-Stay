'use client';

import { Loader2, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  createRoomTypeRequest,
  getApiErrorMessage,
  updateRoomTypeRequest,
} from '@/lib/api';
import type { CreateRoomTypePayload, RoomTypeRecord } from '@/lib/types';
import { cn } from '@/lib/utils';

const AMENITY_OPTIONS = ['WiFi', 'AC', 'Ocean View', 'Pool', 'Mini Bar'] as const;

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

type AddRoomTypeModalProps = {
  open: boolean;
  editing?: RoomTypeRecord | null;
  onClose: () => void;
  onSaved: (type: RoomTypeRecord, mode: 'create' | 'update') => void;
};

export function AddRoomTypeModal({
  open,
  editing,
  onClose,
  onSaved,
}: AddRoomTypeModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('150');
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(0);
  const [amenities, setAmenities] = useState<string[]>(['WiFi', 'AC']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? '');
      setBasePrice(String(Number(editing.baseRate)));
      setMaxAdults(Math.max(1, editing.maxOccupancy));
      setMaxChildren(0);
      setAmenities(editing.amenities ?? []);
    } else {
      setName('');
      setDescription('');
      setBasePrice('150');
      setMaxAdults(2);
      setMaxChildren(0);
      setAmenities(['WiFi', 'AC']);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function toggleAmenity(value: string) {
    setAmenities((prev) =>
      prev.includes(value)
        ? prev.filter((a) => a !== value)
        : [...prev, value],
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const payload: CreateRoomTypePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      basePrice: Number(basePrice) || 0,
      maxAdults,
      maxChildren,
      amenities,
    };
    try {
      if (editing) {
        const updated = await updateRoomTypeRequest(editing.id, payload);
        onSaved(updated, 'update');
      } else {
        const created = await createRoomTypeRequest(payload);
        onSaved(created, 'create');
      }
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to save room type'));
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
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89428] dark:text-[#D4AF37]">
              Inventory
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {editing ? 'Edit room type' : 'Add room type'}
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
          <div>
            <label htmlFor="rt-name" className={labelClass}>
              Category name
            </label>
            <input
              id="rt-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Deluxe Villa"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="rt-desc" className={labelClass}>
              Description
            </label>
            <textarea
              id="rt-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(inputClass, 'h-auto py-2')}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="rt-price" className={labelClass}>
                Base price ($)
              </label>
              <input
                id="rt-price"
                type="number"
                min={0}
                step="0.01"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="rt-adults" className={labelClass}>
                Max adults
              </label>
              <input
                id="rt-adults"
                type="number"
                min={1}
                max={20}
                required
                value={maxAdults}
                onChange={(e) => setMaxAdults(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="rt-kids" className={labelClass}>
                Max children
              </label>
              <input
                id="rt-kids"
                type="number"
                min={0}
                max={20}
                value={maxChildren}
                onChange={(e) => setMaxChildren(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <p className={labelClass}>Amenities</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((option) => {
                const active = amenities.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAmenity(option)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                      active
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                        : 'border-slate-300 text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400',
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editing ? 'Save changes' : 'Create room type'}
          </button>
        </form>
      </div>
    </div>
  );
}
