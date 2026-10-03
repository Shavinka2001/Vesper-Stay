'use client';

import { Loader2, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createMenuItemRequest, getApiErrorMessage } from '@/lib/api';
import type { CreateMenuItemPayload, PosMenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Food', 'Beverages', 'Cocktails', 'Minibar'] as const;

const inputClass =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-[#0B0F17] dark:text-slate-100';

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400';

type AddMenuItemModalProps = {
  open: boolean;
  currency: string;
  onClose: () => void;
  onCreated: (item: PosMenuItem) => void;
};

export function AddMenuItemModal({
  open,
  currency,
  onClose,
  onCreated,
}: AddMenuItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [price, setPrice] = useState('12');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setCategory('Food');
    setPrice('12');
    setDescription('');
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
    const payload: CreateMenuItemPayload = {
      name: name.trim(),
      category,
      price: Number(price) || 0,
      description: description.trim() || undefined,
      isAvailable: true,
    };
    try {
      const item = await createMenuItemRequest(payload);
      toast.success(`Added “${item.name}” to menu`);
      onCreated(item);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to add menu item'));
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
              POS menu
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Add menu item
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
            <label htmlFor="mi-name" className={labelClass}>
              Item name
            </label>
            <input
              id="mi-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sunset Spritz"
              className={inputClass}
            />
          </div>

          <div>
            <span className={labelClass}>Category</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                    category === cat
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                      : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-400',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mi-price" className={labelClass}>
              Price ({currency})
            </label>
            <input
              id="mi-price"
              type="number"
              min={0}
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="mi-desc" className={labelClass}>
              Description
            </label>
            <textarea
              id="mi-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(inputClass, 'h-auto py-2')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 hover:bg-[#C49F27] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add to menu
          </button>
        </form>
      </div>
    </div>
  );
}
