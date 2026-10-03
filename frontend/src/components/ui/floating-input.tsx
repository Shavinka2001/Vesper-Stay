'use client';

import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type FloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FloatingInput({
  id,
  label,
  error,
  className,
  ...props
}: FloatingInputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          id={inputId}
          placeholder={label}
          className={cn(
            'vesper-input peer',
            error && 'border-red-300 focus:border-red-400',
            className,
          )}
          {...props}
        />
        <label htmlFor={inputId} className="vesper-label">
          {label}
        </label>
      </div>
      {error ? <p className="px-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
