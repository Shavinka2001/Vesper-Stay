/** Calendar / tape-chart date helpers (UTC date-only). */

export function toIsoDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
}

export function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function diffDays(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function buildDateRange(start: Date, dayCount: number): Date[] {
  return Array.from({ length: dayCount }, (_, i) => addDays(start, i));
}

export function nightsBetween(checkInIso: string, checkOutIso: string): number {
  return Math.max(1, diffDays(parseIsoDate(checkOutIso), parseIsoDate(checkInIso)));
}

export function formatDayLabel(date: Date): { weekday: string; day: string } {
  return {
    weekday: new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(date),
    day: String(date.getUTCDate()),
  };
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
