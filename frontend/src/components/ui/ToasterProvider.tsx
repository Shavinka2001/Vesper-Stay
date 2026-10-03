'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

/**
 * Global Sonner toaster — Twilight Obsidian / Champagne Gold.
 * Desktop: bottom-right · Mobile: top-center · Expand on hover.
 */
export function ToasterProvider() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<'bottom-right' | 'top-center'>(
    'bottom-right',
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const sync = () =>
      setPosition(media.matches ? 'top-center' : 'bottom-right');
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Toaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position={position}
      expand
      closeButton
      duration={4200}
      gap={10}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-2xl !border !shadow-xl !backdrop-blur-md !font-sans !text-sm',
          title: '!font-semibold !tracking-tight',
          description: '!text-sm !opacity-90',
          closeButton:
            '!border-slate-200 dark:!border-slate-700 !bg-white dark:!bg-slate-900',
          success:
            '!bg-white/95 !border-emerald-200/80 !text-slate-900 dark:!bg-[#111726]/95 dark:!border-emerald-500/30 dark:!text-slate-50 [&>[data-icon]]:!text-emerald-600 dark:[&>[data-icon]]:!text-emerald-400',
          error:
            '!bg-white/95 !border-rose-200/80 !text-slate-900 dark:!bg-[#111726]/95 dark:!border-rose-500/35 dark:!text-slate-50 [&>[data-icon]]:!text-rose-600 dark:[&>[data-icon]]:!text-rose-400',
          info: '!bg-white/95 !border-[#D4AF37]/45 !text-slate-900 dark:!bg-[#111726]/95 dark:!border-[#D4AF37]/40 dark:!text-slate-50 [&>[data-icon]]:!text-[#B89428] dark:[&>[data-icon]]:!text-[#D4AF37]',
          warning:
            '!bg-white/95 !border-amber-200/80 !text-slate-900 dark:!bg-[#111726]/95 dark:!border-amber-500/35 dark:!text-slate-50 [&>[data-icon]]:!text-amber-600 dark:[&>[data-icon]]:!text-amber-400',
        },
      }}
    />
  );
}
