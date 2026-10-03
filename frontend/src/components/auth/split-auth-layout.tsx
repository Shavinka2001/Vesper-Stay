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
    <div className="relative min-h-dvh bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100 lg:grid lg:grid-cols-12">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      {/* Brand showcase */}
      <aside className="relative hidden overflow-hidden lg:col-span-7 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16 xl:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_0%,rgba(212,175,55,0.10),transparent_55%),radial-gradient(ellipse_60%_45%_at_90%_100%,rgba(13,148,136,0.07),transparent_50%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_15%_10%,rgba(212,175,55,0.12),transparent_55%),radial-gradient(ellipse_50%_40%_at_85%_85%,rgba(13,148,136,0.10),transparent_50%)]"
        />

        <div className="relative z-10">
          <Link href="/login" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 font-display text-base tracking-[0.12em] text-[#B89428] dark:text-[#D4AF37]">
              V
            </span>
            <div>
              <p className="font-display text-2xl tracking-[0.04em] text-slate-900 dark:text-slate-100">
                VesperStay
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                Hospitality console
              </p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 max-w-xl py-12">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89428] dark:text-[#D4AF37]"
          >
            Calm operations
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl leading-[1.12] tracking-tight text-slate-900 xl:text-5xl dark:text-slate-50"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-500 dark:text-slate-400"
          >
            {subcopy}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.4 }}
            className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-[#131B2A] dark:text-slate-300 dark:shadow-none"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live OTA Sync Active
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42, duration: 0.5 }}
            className="mt-10 max-w-sm border-l-2 border-[#D4AF37]/50 pl-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
          >
            “Hospitality software should feel as composed as the properties it
            serves.”
          </motion.blockquote>
        </div>

        <p className="relative z-10 max-w-md text-sm leading-relaxed text-slate-400 dark:text-slate-500">
          Powering elite boutique villas, eco-cabanas, and luxury resorts across
          the globe.
        </p>
      </aside>

      {/* Console */}
      <section className="relative flex min-h-dvh flex-col justify-center lg:col-span-5">
        <div className="relative z-10 px-5 pb-2 pt-8 lg:hidden">
          <Link href="/login" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 font-display text-sm tracking-[0.12em] text-[#B89428] dark:text-[#D4AF37]">
              V
            </span>
            <span className="font-display text-xl tracking-[0.04em] text-slate-900 dark:text-slate-100">
              VesperStay
            </span>
          </Link>
          <p className="mt-6 pr-12 font-display text-3xl tracking-tight text-slate-900 dark:text-slate-50">
            {headline}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {subcopy}
          </p>
        </div>

        <div className="relative z-10 flex flex-1 items-center px-4 py-8 sm:px-8 lg:px-10 xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[420px]"
          >
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8 dark:border-slate-800/80 dark:bg-[#131B2A] dark:shadow-none">
              <div className="mb-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#B89428] dark:text-[#D4AF37]">
                  {formEyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl tracking-tight text-slate-900 dark:text-slate-50">
                  {formTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {formSubtitle}
                </p>
              </div>
              {children}
            </div>

            {footer ? (
              <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
