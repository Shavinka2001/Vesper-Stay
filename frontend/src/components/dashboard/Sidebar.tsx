'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { filterNavByRoles } from '@/components/dashboard/nav-config';
import { cn } from '@/lib/utils';

type SidebarProps = {
  propertyName: string | null;
  roles: string[];
  mobileOpen: boolean;
  onClose: () => void;
};

export function Sidebar({
  propertyName,
  roles,
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const items = filterNavByRoles(roles);

  const nav = (
    <div className="relative flex h-full min-h-0 flex-col justify-between">
      {/* Twilight glow at the crown */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,175,55,0.14),transparent_70%)]"
      />

      <div className="relative shrink-0 border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <Link href="/dashboard" onClick={onClose} className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E6C457] to-[#B89428] text-base font-bold text-[#0B0F17] shadow-[0_0_20px_-4px_rgba(212,175,55,0.6)]">
                V
              </span>
              <div className="min-w-0">
                <p className="display truncate text-lg font-semibold leading-none text-white">
                  VesperStay
                </p>
                <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
                  Console
                </p>
              </div>
            </div>
            {propertyName ? (
              <span className="mt-4 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-2.5 py-1.5 text-xs text-amber-200/90">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37]" />
                <span className="truncate">{propertyName}</span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="no-scrollbar relative min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-gradient-to-r from-[#D4AF37]/[0.14] to-transparent font-semibold text-[#E6C457]'
                  : 'font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
              )}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.7)]" />
              ) : null}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-colors',
                  active
                    ? 'text-[#E6C457]'
                    : 'text-slate-500 group-hover:text-slate-300',
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative shrink-0 border-t border-white/[0.06] px-5 py-4">
        <p className="text-[10px] leading-relaxed tracking-wide text-slate-600">
          Twilight hospitality
          <br />
          <span className="text-slate-700">Zero double-booking, by design</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — always twilight obsidian */}
      <aside className="no-scrollbar sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-white/[0.06] bg-[#0B0F17] lg:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className={cn(
            'absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          className={cn(
            'no-scrollbar absolute inset-y-0 left-0 flex h-screen w-[min(100%,288px)] flex-col justify-between overflow-y-auto border-r border-white/[0.06] bg-[#0B0F17] shadow-2xl transition-transform duration-300 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
