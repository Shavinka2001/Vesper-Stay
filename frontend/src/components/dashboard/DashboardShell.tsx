'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navbar } from '@/components/dashboard/Navbar';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { pageTitleFromPath } from '@/components/dashboard/nav-config';
import { useAuthStore } from '@/store/useAuthStore';

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, property, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  if (!user) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const roles = user.roles?.length
    ? user.roles
    : property?.role
      ? [property.role]
      : [];

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#06090F]">
      <Sidebar
        propertyName={property?.name ?? null}
        roles={roles}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={pageTitleFromPath(pathname)}
          userName={fullName || user.email}
          role={property?.role ?? user.globalRole ?? user.roles[0]}
          timezone={property?.timezone}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
