'use client';

import type { LucideIcon } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

type ConsoleFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: ReactNode;
  showPasswordToggle?: boolean;
};

export function ConsoleField({
  label,
  icon: Icon,
  error,
  hint,
  showPasswordToggle,
  className,
  type = 'text',
  id,
  ...props
}: ConsoleFieldProps) {
  const autoId = useId();
  const inputId = id ?? props.name ?? autoId;
  const [revealed, setRevealed] = useState(false);
  const inputType =
    showPasswordToggle && type === 'password'
      ? revealed
        ? 'text'
        : 'password'
      : type;

  return (
    <div className="space-y-1.5">
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#C59B27] dark:text-slate-500 dark:group-focus-within:text-[#D4AF37]" />
        <input
          id={inputId}
          type={inputType}
          placeholder=" "
          className={cn(
            'peer w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-11 text-[15px] text-slate-900 outline-none transition',
            'placeholder:text-transparent',
            'focus:border-[#D4AF37] focus:bg-white focus:ring-4 focus:ring-[#D4AF37]/30',
            'dark:border-slate-700 dark:bg-[#0B0F17]/60 dark:text-slate-100',
            'dark:focus:border-[#D4AF37] dark:focus:bg-[#0B0F17] dark:focus:ring-[#D4AF37]/20',
            error &&
              'border-red-300 focus:border-red-400 focus:ring-red-200/60 dark:border-red-400/40 dark:focus:ring-red-400/20',
            className,
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            'pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 text-sm text-slate-400 transition-all dark:text-slate-500',
            'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-[#C59B27] dark:peer-focus:text-[#D4AF37]',
            'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.14em] peer-[:not(:placeholder-shown)]:text-slate-500',
          )}
        >
          {label}
        </label>
        {showPasswordToggle ? (
          <button
            type="button"
            aria-label={revealed ? 'Hide password' : 'Show password'}
            onClick={() => setRevealed((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="px-1 text-xs text-red-500 dark:text-red-300">{error}</p>
      ) : null}
      {hint && !error ? hint : null}
    </div>
  );
}

export function GoldButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3.5 text-sm font-medium tracking-wide text-slate-950 transition',
        'hover:bg-[#C59B27] active:scale-[0.985]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#D4AF37] disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D4AF37]/30',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function passwordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: 'Fragile', color: 'bg-red-400' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-400' };
  if (score === 3) return { score, label: 'Strong', color: 'bg-[#D4AF37]' };
  return { score, label: 'Vault-grade', color: 'bg-emerald-500' };
}
