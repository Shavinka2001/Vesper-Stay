'use client';

import { Printer, X } from 'lucide-react';
import { useEffect } from 'react';
import { currencySymbol } from '@/components/dashboard/nav-config';
import type { PosOrderResult } from '@/lib/types';

type ReceiptModalProps = {
  open: boolean;
  order: PosOrderResult | null;
  propertyName: string;
  onClose: () => void;
};

function money(amount: string | number, currency: string): string {
  return `${currencySymbol(currency)}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ReceiptModal({
  open,
  order,
  propertyName,
  onClose,
}: ReceiptModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !order) return null;

  const currency = order.currency || 'USD';
  const serviceCharge = Number(order.taxAmount);
  const guestName = order.guest
    ? `${order.guest.firstName} ${order.guest.lastName}`.trim()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 print:static print:inset-auto print:block print:p-0">
      <button
        type="button"
        aria-label="Close backdrop"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px] print:hidden"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-[360px] flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-[#111726] print:max-h-none print:max-w-[80mm] print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 print:hidden dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Receipt preview
          </h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 text-xs font-semibold text-slate-950 hover:bg-[#C49F27]"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 80mm thermal receipt */}
        <div
          id="vesperstay-receipt"
          className="overflow-y-auto bg-white px-5 py-6 font-mono text-[11px] leading-relaxed text-slate-900"
        >
          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.2em]">VESPERSTAY</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
              {order.propertyName || propertyName}
            </p>
            <p className="mt-2 text-[10px] text-slate-500">
              {new Date(order.orderedAt).toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="my-3 border-t border-dashed border-slate-300" />

          {order.paymentMethod === 'CHARGE_TO_ROOM' ? (
            <div className="mb-3 space-y-0.5 text-[10px]">
              <p>
                <span className="text-slate-500">Room:</span>{' '}
                {order.roomNumber || order.room?.number || '—'}
              </p>
              {guestName ? (
                <p>
                  <span className="text-slate-500">Guest:</span> {guestName}
                </p>
              ) : null}
              {order.booking?.confirmationCode ? (
                <p>
                  <span className="text-slate-500">Folio:</span>{' '}
                  {order.booking.confirmationCode}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mb-3 text-[10px]">
              <span className="text-slate-500">Paid:</span>{' '}
              {order.paymentLabel || order.paymentMethod || 'Direct'}
            </p>
          )}

          <div className="space-y-1.5">
            {order.orderItems.map((line) => (
              <div key={line.id} className="flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{line.menuItem.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {line.quantity} × {money(line.unitPrice, currency)}
                  </p>
                </div>
                <p className="shrink-0">{money(line.lineTotal, currency)}</p>
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-slate-300" />

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{money(order.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service (10%)</span>
              <span>{money(serviceCharge, currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span>{money(order.totalAmount, currency)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-slate-300" />

          <p className="text-center text-[10px] text-slate-500">
            Thank you for dining with VesperStay
          </p>
          <p className="mt-1 text-center text-[9px] uppercase tracking-[0.16em] text-slate-400">
            Twilight hospitality
          </p>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body * { visibility: hidden !important; }
                #vesperstay-receipt, #vesperstay-receipt * { visibility: visible !important; }
                #vesperstay-receipt {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 80mm !important;
                  margin: 0 !important;
                  padding: 4mm !important;
                }
              }
            `,
          }}
        />
      </div>
    </div>
  );
}
