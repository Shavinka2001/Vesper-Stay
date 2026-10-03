'use client';

import { ExternalLink, Loader2, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { currencySymbol } from '@/components/dashboard/nav-config';
import {
  checkOutBookingRequest,
  fetchBookingFolio,
  getApiErrorMessage,
} from '@/lib/api';
import type { GuestFolio, TimelineBooking } from '@/lib/types';
import { cn } from '@/lib/utils';

type CheckOutModalProps = {
  open: boolean;
  booking: TimelineBooking | null;
  currency: string;
  onClose: () => void;
  onCompleted: () => void;
};

function money(amount: number, currency: string): string {
  return `${currencySymbol(currency)}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CheckOutModal({
  open,
  booking,
  currency,
  onClose,
  onCompleted,
}: CheckOutModalProps) {
  const [folio, setFolio] = useState<GuestFolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settleAmount, setSettleAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');

  useEffect(() => {
    if (!open || !booking) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchBookingFolio(booking!.id);
        if (cancelled) return;
        setFolio(data);
        setSettleAmount(String(data.balanceDue));
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Unable to load folio'));
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, booking, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !booking) return null;

  async function settleAndCheckout() {
    setSubmitting(true);
    try {
      const result = await checkOutBookingRequest(booking!.id, {
        settleAmount: Number(settleAmount) || 0,
        paymentMethod,
      });
      toast.success('Guest checked out · room marked Dirty');
      if (result.whatsapp.waMeUrl) {
        window.open(result.whatsapp.waMeUrl, '_blank', 'noopener,noreferrer');
        toast.info('WhatsApp invoice draft opened');
      }
      onCompleted();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to complete check-out'));
    } finally {
      setSubmitting(false);
    }
  }

  const cur = folio?.currency || currency;

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
              Guest folio · {booking.confirmationCode}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Check out · {booking.room.number}
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {loading || !folio ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
                <p className="font-semibold text-slate-900 dark:text-slate-50">
                  {folio.guest.firstName} {folio.guest.lastName}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {folio.guest.phone ?? 'No WhatsApp on file'} ·{' '}
                  {folio.nights} night{folio.nights === 1 ? '' : 's'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Folio breakdown
                </p>
                {folio.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 dark:text-slate-100">
                        {line.label}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        {line.kind}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {money(line.amount, cur)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-[#0B0F17]">
                <div className="flex justify-between text-slate-500">
                  <span>Grand total</span>
                  <span>{money(folio.grandTotal, cur)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Already paid</span>
                  <span>{money(folio.paidAmount, cur)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Balance due</span>
                  <span className="text-[#B89428] dark:text-[#D4AF37]">
                    {money(folio.balanceDue, cur)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="co-settle"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                  >
                    Settle now
                  </label>
                  <input
                    id="co-settle"
                    type="number"
                    min={0}
                    step="0.01"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700"
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Method
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['CARD', 'CASH'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          'h-10 rounded-lg border text-xs font-semibold transition',
                          paymentMethod === method
                            ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#8A7020] dark:text-[#D4AF37]'
                            : 'border-slate-300 text-slate-500 dark:border-slate-700',
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2.5">
                <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8A7020] dark:text-[#D4AF37]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp invoice will open after settlement
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Itemized room + F&B charges, totals, and Google Review link.
                </p>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void settleAndCheckout()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-slate-950"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Settle Balance & Check Out
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
