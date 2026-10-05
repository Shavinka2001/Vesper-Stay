'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SplitAuthLayout } from '@/components/auth/split-auth-layout';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const DEMO_ADMIN = {
  email: 'admin@vesperstay.com',
  password: 'Admin@123',
};

const labelClass = 'mb-1.5 block text-xs font-medium text-muted';
const inputClass =
  'h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-gold/60 focus:ring-4 focus:ring-gold/15';
const goldButton =
  'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#E6C457] to-[#B89428] text-sm font-semibold text-[#0B0F17] shadow-gold-sm transition hover:brightness-[1.04] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60';

export default function LoginPage() {
  const router = useRouter();
  const { login, token, isHydrated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isHydrated && token) {
      router.replace('/dashboard');
    }
  }, [isHydrated, token, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remembered = localStorage.getItem('vesperstay_remember_email');
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      if (remember) {
        localStorage.setItem('vesperstay_remember_email', email.trim());
      } else {
        localStorage.removeItem('vesperstay_remember_email');
      }
      toast.success('Welcome back to VesperStay');
      router.replace('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SplitAuthLayout
      headline="Calm operations for extraordinary stays."
      subcopy="One console for reservations, housekeeping, POS and every OTA — composed, so your team can focus on the guest."
      formEyebrow="Welcome back"
      formTitle="Sign in"
      formSubtitle="Enter your work credentials to open your console."
      footer={
        <>
          New property?{' '}
          <Link
            href="/register"
            className="font-medium text-ink underline-offset-4 hover:underline"
          >
            Create a console
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setEmail(DEMO_ADMIN.email);
            setPassword(DEMO_ADMIN.password);
          }}
          className="w-full rounded-xl border border-dashed border-line px-3 py-2 text-xs font-medium text-muted transition hover:border-gold/50 hover:text-ink"
        >
          Use demo login · admin@vesperstay.com
        </button>

        <div>
          <label htmlFor="email" className={labelClass}>
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@property.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(inputClass, 'pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-[#D4AF37]"
            />
            Remember me
          </label>
          <button
            type="button"
            className="text-sm font-medium text-muted transition hover:text-gold-ink"
            onClick={() =>
              toast.info('Password recovery will unlock in a later release.')
            }
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className={goldButton}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </SplitAuthLayout>
  );
}
