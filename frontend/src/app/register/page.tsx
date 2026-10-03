'use client';

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn, slugify } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type PropertyType = 'Hotel' | 'Villa' | 'Cabana' | 'Resort';

const PROPERTY_TYPES: PropertyType[] = ['Hotel', 'Villa', 'Cabana', 'Resort'];

const labelClass =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300';

const inputClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-transparent px-3.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500';

export default function RegisterPage() {
  const router = useRouter();
  const registerProperty = useAuthStore((s) => s.registerProperty);

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const [propertyName, setPropertyName] = useState('');
  const [slug, setSlug] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Hotel');

  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');

  const canContinueStep1 = useMemo(() => {
    return (
      propertyName.trim().length >= 2 &&
      slug.trim().length >= 2 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())
    );
  }, [propertyName, slug]);

  const canLaunch = useMemo(() => {
    return (
      ownerFirstName.trim().length >= 1 &&
      ownerLastName.trim().length >= 1 &&
      ownerEmail.includes('@') &&
      password.length >= 8
    );
  }, [ownerFirstName, ownerLastName, ownerEmail, password]);

  function onPropertyNameChange(value: string) {
    setPropertyName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function goNext(event: FormEvent) {
    event.preventDefault();
    if (!canContinueStep1) {
      toast.info('Complete property details before continuing.');
      return;
    }
    setStep(2);
  }

  async function onLaunch(event: FormEvent) {
    event.preventDefault();
    if (!canLaunch) {
      toast.info('Complete your owner account details.');
      return;
    }

    setLoading(true);
    try {
      await registerProperty({
        propertyName: propertyName.trim(),
        slug: slug.trim().toLowerCase(),
        email: ownerEmail.trim().toLowerCase(),
        currency: 'USD',
        timezone: 'Asia/Colombo',
        address: `${propertyType} property`,
        ownerFirstName: ownerFirstName.trim(),
        ownerLastName: ownerLastName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        password,
      });

      setCelebrating(true);
      toast.success('Property console ready');
      await new Promise((resolve) => setTimeout(resolve, 850));
      router.replace('/dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to launch property',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {celebrating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-md dark:bg-[#090D16]/80">
          <div className="mx-4 flex max-w-sm flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-8 py-10 text-center shadow-xl dark:border-slate-800 dark:bg-[#111726]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-slate-950">
              <Check className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Console ready
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Opening {propertyName || 'your property'}…
            </p>
          </div>
        </div>
      ) : null}

      <div className="relative min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#090D16]">
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
              'radial-gradient(ellipse_70%_60%_at_50%_40%, black, transparent)',
          }}
        />

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-[420px] rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-[#111726]">
            {/* Brand */}
            <div className="mb-6 flex flex-col items-center text-center">
              <Link
                href="/login"
                className="mb-5 inline-flex items-center gap-2.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
                  V
                </span>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  VesperStay
                </span>
              </Link>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Create property console
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {step === 1
                  ? 'Define your property identity.'
                  : 'Set up the owner account.'}
              </p>
            </div>

            {/* Step counter */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step {step} of 2
              </p>
              <div className="flex gap-1.5">
                <span
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-colors',
                    step >= 1 ? 'bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-700',
                  )}
                />
                <span
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-colors',
                    step >= 2 ? 'bg-[#D4AF37]' : 'bg-slate-200 dark:bg-slate-700',
                  )}
                />
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={goNext} className="space-y-5">
                <div>
                  <label htmlFor="propertyName" className={labelClass}>
                    Property name
                  </label>
                  <input
                    id="propertyName"
                    name="propertyName"
                    required
                    value={propertyName}
                    onChange={(e) => onPropertyNameChange(e.target.value)}
                    placeholder="Azure Cliff Villa"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="slug" className={labelClass}>
                    Slug
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="azure-cliff-villa"
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                    vesperstay.com/v/
                    <span className="font-medium text-[#B89428] dark:text-[#D4AF37]">
                      {slug || 'your-slug'}
                    </span>
                  </p>
                </div>

                <div>
                  <span className={labelClass}>Property type</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PROPERTY_TYPES.map((type) => {
                      const active = propertyType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPropertyType(type)}
                          className={cn(
                            'h-10 rounded-lg border text-sm font-medium transition-all',
                            active
                              ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-slate-900 dark:text-slate-100'
                              : 'border-slate-300 bg-transparent text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600',
                          )}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-[#C49F27]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={onLaunch} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ownerFirstName" className={labelClass}>
                      First name
                    </label>
                    <input
                      id="ownerFirstName"
                      name="ownerFirstName"
                      required
                      autoComplete="given-name"
                      value={ownerFirstName}
                      onChange={(e) => setOwnerFirstName(e.target.value)}
                      placeholder="Alex"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerLastName" className={labelClass}>
                      Last name
                    </label>
                    <input
                      id="ownerLastName"
                      name="ownerLastName"
                      required
                      autoComplete="family-name"
                      value={ownerLastName}
                      onChange={(e) => setOwnerLastName(e.target.value)}
                      placeholder="Morgan"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ownerEmail" className={labelClass}>
                    Work email
                  </label>
                  <input
                    id="ownerEmail"
                    name="ownerEmail"
                    type="email"
                    required
                    autoComplete="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@property.com"
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
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={cn(inputClass, 'pr-11')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
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

                <div className="flex gap-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-transparent text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-11 flex-[1.6] items-center justify-center gap-2 rounded-lg bg-[#D4AF37] text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-[#C49F27] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Create console'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have a console?{' '}
            <Link
              href="/login"
              className="font-medium text-slate-800 underline-offset-4 hover:underline dark:text-slate-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
