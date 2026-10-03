'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle: string;
  footer?: ReactNode;
};

export function AuthShell({
  children,
  eyebrow = 'VesperStay',
  title,
  subtitle,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-obsidian-wash"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-vesper-glow"
      />

      <header className="relative z-10 px-5 pb-2 pt-8 sm:px-8 sm:pt-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2.5 active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-gold/40 bg-brand-gold/15 text-sm font-semibold tracking-[0.12em] text-brand-gold">
            V
          </span>
          <span className="font-display text-xl tracking-[0.04em] text-white sm:text-2xl">
            VesperStay
          </span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-10 pt-6 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-6 px-1 text-center sm:mb-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-gold">
              {eyebrow}
            </p>
            <h1 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/65">
              {subtitle}
            </p>
          </div>

          <div className="vesper-card p-5 shadow-gold sm:p-7">{children}</div>

          {footer ? (
            <div className="mt-6 text-center text-sm text-brand-obsidian/60">
              {footer}
            </div>
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}
