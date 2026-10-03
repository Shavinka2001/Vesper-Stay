'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const DEMO_ADMIN = {
  email: 'admin@vesperstay.com',
  password: 'Admin@123',
};

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300';

const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-transparent px-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500';

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
      toast.error(
        error instanceof Error ? error.message : 'Unable to sign in',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#090D16]">
        {/* Subtle ambient glow + grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(212,175,55,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_-5%,rgba(212,175,55,0.10),transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(148 163 184 / 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
          }}
        />

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-[#111726]">
            {/* Brand */}
            <div className="mb-8 flex flex-col items-center text-center">
              <Link href="/login" className="mb-6 inline-flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
                  V
                </span>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  VesperStay
                </span>
              </Link>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Sign in to your console
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Enter your work credentials to continue.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_ADMIN.email);
                  setPassword(DEMO_ADMIN.password);
                }}
                className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-[#D4AF37]/40 dark:hover:text-slate-100"
              >
                Demo Login: admin@vesperstay.com
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
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
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]/30 dark:border-slate-600 dark:bg-transparent"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-slate-400 transition hover:text-[#B89428] dark:hover:text-[#D4AF37]"
                  onClick={() =>
                    toast.info(
                      'Password recovery will unlock in a later release.',
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-[#C49F27] disabled:cursor-not-allowed disabled:opacity-60"
              >
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
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            New property?{' '}
            <Link
              href="/register"
              className="font-medium text-slate-800 underline-offset-4 hover:underline dark:text-slate-200"
            >
              Create console
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
