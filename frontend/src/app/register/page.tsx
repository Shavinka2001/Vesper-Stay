'use client';

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SplitAuthLayout } from '@/components/auth/split-auth-layout';
import { passwordStrength } from '@/components/auth/console-field';
import { cn, slugify } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type PropertyType = 'Hotel' | 'Villa' | 'Cabana' | 'Resort';
const PROPERTY_TYPES: PropertyType[] = ['Hotel', 'Villa', 'Cabana', 'Resort'];

const labelClass = 'mb-1.5 block text-xs font-medium text-muted';
const inputClass =
  'h-11 w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-gold/60 focus:ring-4 focus:ring-gold/15';
const goldButton =
  'flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#E6C457] to-[#B89428] text-sm font-semibold text-[#0B0F17] shadow-gold-sm transition hover:brightness-[1.04] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60';

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

  const strength = useMemo(() => passwordStrength(password), [password]);

  const canContinueStep1 = useMemo(
    () =>
      propertyName.trim().length >= 2 &&
      slug.trim().length >= 2 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim()),
    [propertyName, slug],
  );

  const canLaunch = useMemo(
    () =>
      ownerFirstName.trim().length >= 1 &&
      ownerLastName.trim().length >= 1 &&
      ownerEmail.includes('@') &&
      password.length >= 8,
    [ownerFirstName, ownerLastName, ownerEmail, password],
  );

  function onPropertyNameChange(value: string) {
    setPropertyName(value);
    if (!slugTouched) setSlug(slugify(value));
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md">
          <div className="vesper-card mx-4 flex max-w-sm flex-col items-center px-8 py-10 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6C457] to-[#B89428] text-[#0B0F17]">
              <Check className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <p className="display text-2xl text-ink">Console ready</p>
            <p className="mt-2 text-sm text-muted">
              Opening {propertyName || 'your property'}…
            </p>
          </div>
        </div>
      ) : null}

      <SplitAuthLayout
        headline="Launch your property in minutes."
        subcopy="Create your console, add your rooms, connect your channels — and take your first booking today."
        formEyebrow={`Step ${step} of 2`}
        formTitle={step === 1 ? 'Your property' : 'Owner account'}
        formSubtitle={
          step === 1
            ? 'Define how your property appears across the platform.'
            : 'This is the account you’ll sign in with.'
        }
        footer={
          <>
            Already have a console?{' '}
            <Link
              href="/login"
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        }
      >
        {/* Step progress */}
        <div className="mb-6 flex gap-1.5">
          <span
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              step >= 1 ? 'bg-gold' : 'bg-line',
            )}
          />
          <span
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              step >= 2 ? 'bg-gold' : 'bg-line',
            )}
          />
        </div>

        {step === 1 ? (
          <form onSubmit={goNext} className="space-y-5">
            <div>
              <label htmlFor="propertyName" className={labelClass}>
                Property name
              </label>
              <input
                id="propertyName"
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
                required
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="azure-cliff-villa"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-muted">
                vesperstay.com/v/
                <span className="font-medium text-gold-ink">
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
                        'h-10 rounded-xl border text-sm font-medium transition-all',
                        active
                          ? 'border-gold bg-gold/15 text-ink'
                          : 'border-line text-muted hover:border-gold/40',
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className={cn(goldButton, 'w-full')}>
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
              {password ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-1.5 flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          'flex-1 rounded-full transition-colors',
                          i < strength.score ? strength.color : 'bg-line',
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-muted">
                    {strength.label}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium text-muted transition hover:border-gold/40 hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={cn(goldButton, 'flex-[1.6]')}
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
      </SplitAuthLayout>
    </>
  );
}
