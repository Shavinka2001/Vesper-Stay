'use client';

import {
  BedDouble,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Printer,
  Search,
  Trash2,
  Banknote,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AddMenuItemModal } from '@/components/pos/AddMenuItemModal';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { currencySymbol } from '@/components/dashboard/nav-config';
import {
  createPosOrderRequest,
  fetchInHouseFolios,
  fetchPosMenu,
  fetchPosOrdersToday,
  getApiErrorMessage,
} from '@/lib/api';
import type {
  InHouseFolio,
  PosMenuItem,
  PosOrderResult,
  PosPaymentMethod,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const CATEGORY_TABS = [
  'All',
  'Food',
  'Beverages',
  'Cocktails',
  'Minibar',
] as const;

const SERVICE_RATE = 0.1;

const BILLING_OPTIONS: Array<{
  value: PosPaymentMethod;
  label: string;
  hint: string;
  icon: typeof BedDouble;
}> = [
  {
    value: 'CHARGE_TO_ROOM',
    label: 'Charge to Room / Cabana',
    hint: 'Post to in-house folio',
    icon: BedDouble,
  },
  {
    value: 'CASH',
    label: 'Cash Payment',
    hint: 'Direct walk-in sale',
    icon: Banknote,
  },
  {
    value: 'CARD',
    label: 'Card Payment',
    hint: 'Direct card sale',
    icon: CreditCard,
  },
];

type CartLine = {
  menuItemId: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
};

function money(amount: number, currency: string): string {
  return `${currencySymbol(currency)}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PosPage() {
  const property = useAuthStore((s) => s.property);
  const currency = property?.currency ?? 'USD';

  const [items, setItems] = useState<PosMenuItem[]>([]);
  const [folios, setFolios] = useState<InHouseFolio[]>([]);
  const [todaySales, setTodaySales] = useState({ orderCount: 0, salesTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] =
    useState<(typeof CATEGORY_TABS)[number]>('All');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] =
    useState<PosPaymentMethod>('CHARGE_TO_ROOM');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<PosOrderResult | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menu, inHouse, today] = await Promise.all([
        fetchPosMenu(),
        fetchInHouseFolios(),
        fetchPosOrdersToday(),
      ]);
      setItems(menu.items);
      setFolios(inHouse);
      setTodaySales({
        orderCount: today.orderCount,
        salesTotal: today.salesTotal,
      });
      setSelectedBookingId((current) => {
        if (current && inHouse.some((f) => f.bookingId === current)) {
          return current;
        }
        return inHouse[0]?.bookingId ?? '';
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to load POS catalog'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!item.isAvailable) return false;
      if (category !== 'All' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, query, category]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );
  const serviceCharge = Math.round(subtotal * SERVICE_RATE * 100) / 100;
  const total = Math.round((subtotal + serviceCharge) * 100) / 100;

  function addToCart(item: PosMenuItem) {
    setPressedId(item.id);
    window.setTimeout(() => setPressedId(null), 160);
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItemId === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItemId === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          category: item.category,
          unitPrice: Number(item.price),
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.menuItemId === menuItemId
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  function removeLine(menuItemId: string) {
    setCart((prev) => prev.filter((line) => line.menuItemId !== menuItemId));
  }

  function clearCart() {
    setCart([]);
  }

  async function placeOrder() {
    if (cart.length === 0) {
      toast.info('Add items to the cart first');
      return;
    }
    if (paymentMethod === 'CHARGE_TO_ROOM' && !selectedBookingId) {
      toast.info('Select an in-house room to charge');
      return;
    }

    setSubmitting(true);
    try {
      const folio = folios.find((f) => f.bookingId === selectedBookingId);
      const order = await createPosOrderRequest({
        items: cart.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
        totalAmount: total,
        paymentMethod,
        bookingId:
          paymentMethod === 'CHARGE_TO_ROOM' ? selectedBookingId : undefined,
        roomId: paymentMethod === 'CHARGE_TO_ROOM' ? folio?.roomId : undefined,
        roomNumber:
          paymentMethod === 'CHARGE_TO_ROOM' ? folio?.roomNumber : undefined,
      });
      toast.success(
        paymentMethod === 'CHARGE_TO_ROOM'
          ? 'Order charged to guest folio'
          : 'Order placed successfully',
      );
      setLastOrder(order);
      setReceiptOpen(true);
      clearCart();
      const [inHouse, today] = await Promise.all([
        fetchInHouseFolios(),
        fetchPosOrdersToday(),
      ]);
      setFolios(inHouse);
      setTodaySales({
        orderCount: today.orderCount,
        salesTotal: today.salesTotal,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to place order'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mx-auto mb-4 flex max-w-[1600px] flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Restaurant, Bar & Cabana POS
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Touch ordering with folio posting for in-house guests.
          </p>
        </div>
        <div className="flex gap-3 text-xs sm:text-sm">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-[#111726]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Today&apos;s tickets
            </p>
            <p className="font-semibold text-slate-900 dark:text-slate-50">
              {todaySales.orderCount}
            </p>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A7020] dark:text-[#D4AF37]">
              Today&apos;s sales
            </p>
            <p className="font-semibold text-[#8A7020] dark:text-[#D4AF37]">
              {money(todaySales.salesTotal, currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-12 lg:gap-6">
        {/* LEFT — Menu catalog (7 cols) */}
        <section className="flex min-h-[70vh] flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-[#111726] lg:col-span-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes & drinks…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
              />
            </div>
            <button
              type="button"
              onClick={() => setMenuModalOpen(true)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 text-sm font-semibold text-slate-950 hover:bg-[#C49F27]"
            >
              <Plus className="h-4 w-4" />
              Add Menu Item
            </button>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                  category === tab
                    ? 'bg-slate-900 text-white dark:bg-[#D4AF37] dark:text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-center dark:border-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  No menu items yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add food, drinks, or minibar products to start selling.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className={cn(
                      'group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-left transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-[#D4AF37]/40',
                      pressedId === item.id &&
                        'scale-[0.97] border-[#D4AF37] bg-[#D4AF37]/10',
                    )}
                  >
                    <span className="mb-2 inline-flex w-fit rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                      {item.category}
                    </span>
                    <span className="line-clamp-2 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {item.name}
                    </span>
                    <span className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-[#B89428] dark:text-[#D4AF37]">
                        {money(Number(item.price), currency)}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white transition group-hover:bg-[#D4AF37] group-hover:text-slate-950 dark:bg-slate-100 dark:text-slate-900">
                        <Plus className="h-4 w-4" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — Live register (5 cols) */}
        <section className="flex min-h-[70vh] flex-col rounded-2xl border border-slate-800 bg-[#0B0F17] p-4 text-slate-100 shadow-xl sm:p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
                Live register
              </p>
              <h2 className="text-lg font-semibold">Current order</h2>
            </div>
            {cart.length > 0 ? (
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            ) : null}
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
                Tap menu items to build an order
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.menuItemId}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {money(line.unitPrice, currency)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQty(line.menuItemId, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQty(line.menuItemId, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="w-14 shrink-0 text-right text-sm font-semibold text-[#D4AF37]">
                    {money(line.unitPrice * line.quantity, currency)}
                  </p>
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeLine(line.menuItemId)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/40 hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{money(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Service charge (10%)</span>
              <span>{money(serviceCharge, currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-[#D4AF37]">{money(total, currency)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Billing
            </p>
            <div className="space-y-2">
              {BILLING_OPTIONS.map(({ value, label, hint, icon: Icon }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition',
                    paymentMethod === value
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-slate-700 hover:border-slate-600',
                  )}
                >
                  <input
                    type="radio"
                    name="pos-billing"
                    checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)}
                    className="mt-1 h-4 w-4 border-slate-600 text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <Icon
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      paymentMethod === value
                        ? 'text-[#D4AF37]'
                        : 'text-slate-500',
                    )}
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block text-sm font-semibold',
                        paymentMethod === value
                          ? 'text-[#D4AF37]'
                          : 'text-slate-200',
                      )}
                    >
                      {label}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {paymentMethod === 'CHARGE_TO_ROOM' ? (
              <div className="pt-1">
                <label
                  htmlFor="folio"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  In-house room / cabana
                </label>
                {folios.length === 0 ? (
                  <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
                    No checked-in guests. Check a guest in first, then charge
                    their folio.
                  </p>
                ) : (
                  <select
                    id="folio"
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {folios.map((folio) => (
                      <option key={folio.bookingId} value={folio.bookingId}>
                        {folio.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={
              submitting ||
              cart.length === 0 ||
              (paymentMethod === 'CHARGE_TO_ROOM' && !selectedBookingId)
            }
            onClick={() => void placeOrder()}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-sm font-semibold text-slate-950 shadow-lg shadow-[#D4AF37]/20 transition hover:bg-[#C49F27] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Place Order & Print Thermal Receipt
          </button>
        </section>
      </div>

      <AddMenuItemModal
        open={menuModalOpen}
        currency={currency}
        onClose={() => setMenuModalOpen(false)}
        onCreated={(item) => {
          setItems((prev) =>
            [...prev, item].sort((a, b) => a.name.localeCompare(b.name)),
          );
        }}
      />

      <ReceiptModal
        open={receiptOpen}
        order={lastOrder}
        propertyName={property?.name ?? 'VesperStay'}
        onClose={() => setReceiptOpen(false)}
      />
    </>
  );
}
