/**
 * Minimal, pure iCalendar (RFC 5545) reader/writer for the channel manager.
 *
 * Scope is deliberately narrow: all-day "busy" blocks, which is exactly what
 * OTA calendar sync (Airbnb / Booking.com / Google) exchanges. Each booking is
 * one VEVENT with DATE-valued DTSTART/DTEND. DTEND is *exclusive* in iCal — the
 * checkout day is free — which lines up precisely with our half-open booking
 * ranges and the bookings_no_overlap constraint.
 *
 * Everything here is pure (no I/O, no network) so it can be exhaustively
 * unit-tested. The service layer does the fetching and DB work around it.
 */

export interface CalendarEvent {
  uid: string;
  summary: string;
  /** Inclusive start, 'YYYY-MM-DD'. */
  start: string;
  /** Exclusive end, 'YYYY-MM-DD' (iCal DTEND semantics = checkout day). */
  end: string;
}

export interface GenerateCalendarOptions {
  prodId?: string;
  calName?: string;
  /** Injectable for deterministic output in tests; defaults to now. */
  dtStamp?: Date;
}

const CRLF = '\r\n';

/** 'YYYY-MM-DD' or Date → 'YYYYMMDD' (DATE value). */
export function toICalDate(value: Date | string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date for iCal: ${String(value)}`);
  }
  const y = d.getUTCFullYear().toString().padStart(4, '0');
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = d.getUTCDate().toString().padStart(2, '0');
  return `${y}${m}${day}`;
}

/** 'YYYYMMDD' (or a datetime like 'YYYYMMDDT..Z') → 'YYYY-MM-DD'. */
export function fromICalDate(value: string): string {
  const digits = value.trim().replace(/[^0-9]/g, '');
  if (digits.length < 8) {
    throw new Error(`Invalid iCal DATE value: ${value}`);
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/** Add whole days to a 'YYYY-MM-DD' date, returning 'YYYY-MM-DD'. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Escape a TEXT value per RFC 5545 §3.3.11. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Reverse escapeText for parsed values. */
export function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Fold a content line to 75 octets with CRLF + space continuation. */
export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let rest = line;
  chunks.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    // Continuation lines are prefixed with a single space (counts toward 75).
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return chunks.join(CRLF);
}

/** Undo RFC 5545 line folding: a line starting with space/tab continues the previous. */
export function unfoldLines(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

/** Build a VCALENDAR string from all-day busy events. */
export function generateICal(
  events: CalendarEvent[],
  options: GenerateCalendarOptions = {},
): string {
  const prodId = options.prodId ?? '-//VesperStay//Channel Manager//EN';
  const calName = options.calName ?? 'VesperStay';
  const stamp = formatStamp(options.dtStamp ?? new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
  ];

  for (const event of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toICalDate(event.start)}`,
      `DTEND;VALUE=DATE:${toICalDate(event.end)}`,
      foldLine(`SUMMARY:${escapeText(event.summary)}`),
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** Parse a VCALENDAR string into all-day events. Tolerant of unknown props. */
export function parseICal(text: string): CalendarEvent[] {
  const lines = unfoldLines(text);
  const events: CalendarEvent[] = [];
  let current: Partial<CalendarEvent> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      if (current?.start) {
        events.push({
          uid: current.uid ?? '',
          summary: current.summary ?? '',
          start: current.start,
          // Many feeds omit DTEND for single-day blocks → default to +1 day.
          end: current.end ?? addDays(current.start, 1),
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const rawKey = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const key = rawKey.split(';')[0]?.toUpperCase();

    if (key === 'UID') current.uid = value.trim();
    else if (key === 'SUMMARY') current.summary = unescapeText(value.trim());
    else if (key === 'DTSTART') current.start = fromICalDate(value);
    else if (key === 'DTEND') current.end = fromICalDate(value);
  }

  return events;
}

function formatStamp(date: Date): string {
  const iso = date.toISOString(); // 2026-10-03T12:34:56.789Z
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20261003T123456Z
}
