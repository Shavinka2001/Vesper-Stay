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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-surface-3 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Console
          </p>
          <h1 className="display truncate text-lg font-semibold leading-tight text-ink sm:text-xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted sm:inline-flex">
          {dateLabel}
        </span>

        <ThemeToggle className="h-9 w-9 rounded-xl" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-2.5 transition hover:border-gold/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E6C457] to-[#B89428] text-xs font-bold text-[#0B0F17]">
              {initials || 'VS'}
            </span>
            <span className="hidden max-w-[120px] truncate text-left text-sm font-medium text-ink md:block">
              {userName}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted transition',
                menuOpen && 'rotate-180',
              )}
            />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
              <div className="border-b border-line px-4 py-3">
                <p className="truncate text-sm font-semibold text-ink">
                  {userName}
                </p>
                <span className="mt-1.5 inline-flex rounded-md bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-ink">
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
