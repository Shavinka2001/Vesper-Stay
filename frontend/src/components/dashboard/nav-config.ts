import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Radio,
  Settings,
  UsersRound,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';

export type StaffRole =
  | 'SUPER_ADMIN'
  | 'HOTEL_OWNER'
  | 'MANAGER'
  | 'FRONT_DESK'
  | 'HOUSEKEEPING';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: StaffRole[];
};

const ALL_ROLES: StaffRole[] = [
  'SUPER_ADMIN',
  'HOTEL_OWNER',
  'MANAGER',
  'FRONT_DESK',
  'HOUSEKEEPING',
];

const OPS_ROLES: StaffRole[] = [
  'SUPER_ADMIN',
  'HOTEL_OWNER',
  'MANAGER',
  'FRONT_DESK',
];

const MANAGEMENT_ROLES: StaffRole[] = [
  'SUPER_ADMIN',
  'HOTEL_OWNER',
  'MANAGER',
];

export const DASHBOARD_NAV: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    label: 'Tape Chart',
    href: '/dashboard/calendar',
    icon: CalendarDays,
    roles: ALL_ROLES,
  },
  {
    label: 'Bookings & Guests',
    href: '/dashboard/bookings',
    icon: ClipboardList,
    roles: OPS_ROLES,
  },
  {
    label: 'Restaurant & Cabana POS',
    href: '/dashboard/pos',
    icon: UtensilsCrossed,
    roles: OPS_ROLES,
  },
  {
    label: 'Inventory & Stock',
    href: '/dashboard/inventory',
    icon: Package,
    roles: [...MANAGEMENT_ROLES, 'HOUSEKEEPING'],
  },
  {
    label: 'Expenses & Cashflow',
    href: '/dashboard/expenses',
    icon: Wallet,
    roles: MANAGEMENT_ROLES,
  },
  {
    label: 'Channel Manager',
    href: '/dashboard/channels',
    icon: Radio,
    roles: MANAGEMENT_ROLES,
  },
  {
    label: 'Staff & Access',
    href: '/dashboard/staff',
    icon: UsersRound,
    roles: MANAGEMENT_ROLES,
  },
  {
    label: 'Rooms & Inventory',
    href: '/dashboard/settings',
    icon: Settings,
    roles: MANAGEMENT_ROLES,
  },
];

export function filterNavByRoles(roles: string[]): NavItem[] {
  const set = new Set(roles);
  if (set.has('SUPER_ADMIN') || set.has('HOTEL_OWNER')) {
    return DASHBOARD_NAV;
  }
  return DASHBOARD_NAV.filter((item) =>
    item.roles.some((role) => set.has(role)),
  );
}

export function formatRoleBadge(role: string | null | undefined): string {
  if (!role) return 'STAFF';
  const map: Record<string, string> = {
    SUPER_ADMIN: 'SUPER ADMIN',
    HOTEL_OWNER: 'OWNER',
    MANAGER: 'MANAGER',
    FRONT_DESK: 'FRONT DESK',
    HOUSEKEEPING: 'HOUSEKEEPING',
  };
  return map[role] ?? role.replaceAll('_', ' ');
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function currencySymbol(code: string | null | undefined): string {
  const map: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    LKR: 'Rs ',
    AED: 'AED ',
  };
  if (!code) return '$';
  return map[code.toUpperCase()] ?? `${code} `;
}

export function pageTitleFromPath(pathname: string): string {
  const item = DASHBOARD_NAV.find(
    (nav) =>
      nav.href === pathname ||
      (nav.href !== '/dashboard' && pathname.startsWith(nav.href)),
  );
  return item?.label ?? 'Overview';
}
