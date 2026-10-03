'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';

type ComingSoonProps = {
  title: string;
  description: string;
  icon?: ReactNode;
};

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-[#111726]">
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#B89428] dark:text-[#D4AF37]">
          {icon}
        </div>
      ) : null}
      <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-slate-950"
      >
        Back to Overview
      </Link>
    </div>
  );
}
