/** Today's date (YYYY-MM-DD) in the given IANA timezone, e.g. the clinic's timezone. */
export function todayInZone(timeZone: string, now: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

function parse(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const d = parse(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

/** Monday of the week containing the date. */
export function startOfWeek(isoDate: string): string {
  const d = parse(isoDate);
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(isoDate, -offset);
}

export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export function addMonths(isoDate: string, months: number): string {
  const d = parse(startOfMonth(isoDate));
  d.setUTCMonth(d.getUTCMonth() + months);
  return iso(d);
}

export function endOfMonth(isoDate: string): string {
  return addDays(addMonths(isoDate, 1), -1);
}

export function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** "MONDAY".."SUNDAY" for an ISO date. */
export function dayOfWeek(isoDate: string): 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' {
  const names = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
  return names[parse(isoDate).getUTCDay()];
}
