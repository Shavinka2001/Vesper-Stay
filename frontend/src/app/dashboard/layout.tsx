'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { token, user, isHydrated, refreshMe } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    void refreshMe();
    // Intentionally run once after hydration; refreshMe/router are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, token, user]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-[#06090F]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Restoring your console…
        </p>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#06090F]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
