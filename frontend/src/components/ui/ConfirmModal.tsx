'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onCancel]);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close confirmation backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
            onClick={() => {
              if (!loading) onCancel();
            }}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
          >
            <div className="flex items-start gap-3">
              {isDestructive ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-title"
                  className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50"
                >
                  {title}
                </h2>
                <p
                  id="confirm-description"
                  className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
                >
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={onCancel}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-transparent px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleConfirm()}
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60',
                  isDestructive
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-[#D4AF37] text-slate-950 hover:bg-[#C49F27]',
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
