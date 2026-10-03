import {
  addDays,
  escapeText,
  foldLine,
  fromICalDate,
  generateICal,
  parseICal,
  toICalDate,
  unescapeText,
  unfoldLines,
  type CalendarEvent,
} from '@modules/channel-manager/ical';

const STAMP = new Date('2026-10-03T12:00:00.000Z');

describe('date helpers', () => {
  it('toICalDate formats to YYYYMMDD (UTC)', () => {
    expect(toICalDate('2026-01-09')).toBe('20260109');
    expect(toICalDate(new Date('2026-12-25T00:00:00Z'))).toBe('20261225');
  });

  it('fromICalDate parses DATE and DATE-TIME forms', () => {
    expect(fromICalDate('20260109')).toBe('2026-01-09');
    expect(fromICalDate('20260109T140000Z')).toBe('2026-01-09');
  });

  it('addDays crosses month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('text escaping', () => {
  it('escapes and unescapes special characters round-trip', () => {
    const raw = 'Smith, John; room 5\\A\nnote';
    expect(unescapeText(escapeText(raw))).toBe(raw);
  });

  it('escapes commas and semicolons as required by RFC 5545', () => {
    expect(escapeText('a,b;c')).toBe('a\\,b\\;c');
  });
});

describe('line folding', () => {
  it('leaves short lines untouched', () => {
    expect(foldLine('SUMMARY:Reserved')).toBe('SUMMARY:Reserved');
  });

  it('folds lines longer than 75 octets with CRLF + space', () => {
    const long = 'SUMMARY:' + 'x'.repeat(120);
    const folded = foldLine(long);
    expect(folded).toContain('\r\n ');
    // Unfolding must restore the original single line.
    expect(unfoldLines(folded).join('')).toBe(long);
  });
});

describe('generateICal', () => {
  const events: CalendarEvent[] = [
    { uid: 'VS-ABC123@vesperstay', summary: 'Reserved', start: '2026-01-10', end: '2026-01-13' },
  ];

  it('produces a well-formed VCALENDAR with all-day VEVENT', () => {
    const ics = generateICal(events, { dtStamp: STAMP });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:VS-ABC123@vesperstay');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260110');
    expect(ics).toContain('DTEND;VALUE=DATE:20260113');
    expect(ics).toContain('DTSTAMP:20261003T120000Z');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics.endsWith('\r\n')).toBe(true);
  });
});

describe('parseICal', () => {
  it('round-trips generated calendars', () => {
    const events: CalendarEvent[] = [
      { uid: 'a@x', summary: 'Reserved', start: '2026-01-10', end: '2026-01-13' },
      { uid: 'b@x', summary: 'Guest, VIP', start: '2026-02-01', end: '2026-02-05' },
    ];
    const parsed = parseICal(generateICal(events, { dtStamp: STAMP }));
    expect(parsed).toEqual(events);
  });

  it('defaults DTEND to start + 1 day when the feed omits it', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:single@airbnb',
      'DTSTART;VALUE=DATE:20260301',
      'SUMMARY:Airbnb (Not available)',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const parsed = parseICal(ics);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ start: '2026-03-01', end: '2026-03-02' });
  });

  it('parses a realistic Airbnb-style feed (CRLF, folding, params)', () => {
    const ics =
      'BEGIN:VCALENDAR\r\n' +
      'PRODID:-//Airbnb Inc//Hosting Calendar 1.0//EN\r\n' +
      'VERSION:2.0\r\n' +
      'BEGIN:VEVENT\r\n' +
      'DTEND;VALUE=DATE:20260420\r\n' +
      'DTSTART;VALUE=DATE:20260417\r\n' +
      'UID:1234567890abcdef@airbnb.com\r\n' +
      'SUMMARY:Reserved\r\n' +
      'END:VEVENT\r\n' +
      'END:VCALENDAR\r\n';
    const parsed = parseICal(ics);
    expect(parsed).toEqual([
      {
        uid: '1234567890abcdef@airbnb.com',
        summary: 'Reserved',
        start: '2026-04-17',
        end: '2026-04-20',
      },
    ]);
  });

  it('ignores non-VEVENT content and malformed lines', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'X-WR-CALNAME:Whatever',
      'garbage-without-colon',
      'BEGIN:VEVENT',
      'UID:ok@x',
      'DTSTART;VALUE=DATE:20260101',
      'DTEND;VALUE=DATE:20260102',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    expect(parseICal(ics)).toHaveLength(1);
  });
});
