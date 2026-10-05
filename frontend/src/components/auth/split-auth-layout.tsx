'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

type SplitAuthLayoutProps = {
  children: ReactNode;
  headline: string;
  subcopy: string;
  formEyebrow: string;
  formTitle: string;
  formSubtitle: string;
  footer?: ReactNode;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const HIGHLIGHTS = [
  'Zero double-booking, by design',
  'Real-time OTA calendar sync',
  'WhatsApp guest concierge',
];

export function SplitAuthLayout({
  children,
  headline,
  subcopy,
  formEyebrow,
  formTitle,
  formSubtitle,
  footer,
}: SplitAuthLayoutProps) {
  return (
    <div className="relative min-h-dvh bg-bg text-ink lg:grid lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr]">
      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      {/* ── Brand panel (always twilight obsidian) ───────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-obsidian-wash lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14 xl:px-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_20%_0%,rgba(212,175,55,0.16),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(13,148,136,0.12),transparent_70%)]"
        />

        {/* Wordmark */}
        <Link href="/login" className="relative z-10 inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E6C457] to-[#B89428] text-lg font-bold text-[#0B0F17] shadow-[0_0_24px_-4px_rgba(212,175,55,0.6)]">
            V
          </span>
          <div>
            <p className="display text-2xl leading-none text-white">VesperStay</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.26em] text-white/45">
              Hospitality Console
            </p>
          </div>
        </Link>

        {/* Headline */}
        <div className="relative z-10 max-w-lg">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E6C457]"
          >
            Twilight hospitality
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5, ease: EASE }}
            className="display text-4xl leading-[1.1] text-white xl:text-[52px]"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.45 }}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-white/55"
          >
            {subcopy}
          </motion.p>
        </div>

        {/* Value highlights */}
        <motion.ul
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.45 }}
          className="relative z-10 space-y-3"
        >
          {HIGHLIGHTS.map((line) => (
            <li
              key={line}
              className="flex items-center gap-3 text-sm text-white/70"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
              {line}
            </li>
          ))}
        </motion.ul>
      </aside>

      {/* ── Form panel ───────────────────────────────────────────────────── */}
      <section className="relative flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-8">
        {/* Compact brand for mobile */}
        <div className="mb-8 lg:hidden">
          <Link href="/login" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E6C457] to-[#B89428] text-sm font-bold text-[#0B0F17]">
              V
            </span>
            <span className="display text-xl text-ink">VesperStay</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mx-auto w-full max-w-[400px]"
        >
          <div className="mb-7">
            <p className="eyebrow">{formEyebrow}</p>
            <h2 className="display mt-2 text-3xl text-ink">{formTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {formSubtitle}
            </p>
          </div>

          {children}

          {footer ? (
            <div className="mt-7 text-center text-sm text-muted">{footer}</div>
          ) : null}
        </motion.div>
      </section>
    </div>
  );
}
