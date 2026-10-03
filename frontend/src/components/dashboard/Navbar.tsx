'use client';

import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { formatRoleBadge } from '@/components/dashboard/nav-config';
import { cn } from '@/lib/utils';

type NavbarProps = {
  title: string;
  userName: string;
  role: string | null | undefined;
  timezone?: string | null;
  onMenuClick: () => void;
  onLogout: () => void;
};

export function Navbar({
  title,
  userName,
  role,
  timezone,
  onMenuClick,
  onLogout,
}: NavbarProps) {
  const [now, setNow] = useState(() => new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || undefined,
  }).format(now);

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-[#0E1420]/90">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Console
          </p>
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-slate-50">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {dateLabel}
        </span>

        <ThemeToggle className="h-9 w-9 rounded-xl" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:border-slate-300 dark:border-slate-700 dark:bg-[#111726] dark:hover:border-slate-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white dark:bg-[#D4AF37] dark:text-slate-950">
              {initials || 'VS'}
            </span>
            <span className="hidden max-w-[120px] truncate text-left text-sm font-medium text-slate-800 md:block dark:text-slate-100">
              {userName}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-slate-400 transition',
                menuOpen && 'rotate-180',
              )}
            />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-[#111726]">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {userName}
                </p>
                <span className="mt-1.5 inline-flex rounded-md bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8A7020] dark:text-[#D4AF37]">
                  {formatRoleBadge(role)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
