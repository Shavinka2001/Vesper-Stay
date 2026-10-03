'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type ToastTone = 'error' | 'success';

type ToastProps = {
  open: boolean;
  message: string;
  tone?: ToastTone;
  onClose: () => void;
  durationMs?: number;
};

export function Toast({
  open,
  message,
  tone = 'error',
  onClose,
  durationMs = 4200,
}: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, onClose, durationMs]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={cn(
            'fixed left-4 right-4 top-4 z-[60] mx-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md sm:left-1/2 sm:right-auto sm:-translate-x-1/2',
            tone === 'error'
              ? 'border-red-200 bg-white text-red-700 shadow-slate-200/50 dark:border-red-400/30 dark:bg-[#131B2A] dark:text-red-300 dark:shadow-none'
              : 'border-emerald-200 bg-white text-slate-800 shadow-slate-200/50 dark:border-emerald-400/25 dark:bg-[#131B2A] dark:text-slate-100 dark:shadow-none',
          )}
        >
          {tone === 'error' ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          )}
          <p className="flex-1 text-sm leading-relaxed">{message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
