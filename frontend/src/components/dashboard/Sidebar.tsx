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
    <div className="flex h-full min-h-0 flex-col justify-between">
      <div className="shrink-0 border-b border-slate-800/80 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="min-w-0 flex-1"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37] text-sm font-bold text-[#0B0F17]">
                V
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-white">
                  VesperStay
                </p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Console
                </p>
              </div>
            </div>
            {propertyName ? (
              <span className="mt-3 inline-flex max-w-full items-center rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-amber-300/90">
                <span className="truncate">{propertyName}</span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-900 hover:text-slate-200 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3 no-scrollbar">
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                active
                  ? 'bg-[#D4AF37]/15 font-semibold text-[#D4AF37] shadow-sm'
                  : 'font-medium text-slate-400 hover:bg-slate-900/80 hover:text-slate-100',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  active ? 'text-[#D4AF37]' : 'text-slate-500',
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-800/80 px-4 py-3">
        <p className="text-[10px] leading-relaxed text-slate-600">
          Twilight hospitality · Zero double-booking
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — always twilight obsidian */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-800/80 bg-[#0B0F17] no-scrollbar lg:flex">
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
            'absolute inset-y-0 left-0 flex h-screen w-[min(100%,288px)] flex-col justify-between overflow-y-auto border-r border-slate-800/80 bg-[#0B0F17] shadow-2xl transition-transform duration-300 ease-out no-scrollbar',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
