import type { AppointmentStatus, DayOfWeek } from '../types';

const LOCALE = import.meta.env.VITE_LOCALE || 'en-IN';
const CURRENCY = import.meta.env.VITE_CURRENCY || 'INR';

export const DAYS_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const DAY_LABELS: Record<DayOfWeek, { short: string; long: string }> = {
  MONDAY: { short: 'Mon', long: 'Monday' },
  TUESDAY: { short: 'Tue', long: 'Tuesday' },
  WEDNESDAY: { short: 'Wed', long: 'Wednesday' },
  THURSDAY: { short: 'Thu', long: 'Thursday' },
  FRIDAY: { short: 'Fri', long: 'Friday' },
  SATURDAY: { short: 'Sat', long: 'Saturday' },
  SUNDAY: { short: 'Sun', long: 'Sunday' },
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

/** "14:30" -> "2:30 PM" */
export function formatTime(time?: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "2026-12-03" -> "Thu, 3 Dec 2026" (date-only, no timezone shifting). */
export function formatDate(date?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '';
  const [y, mo, d] = date.split('-').map(Number);
  const value = new Date(Date.UTC(y, mo - 1, d));
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
    ...opts,
  }).format(value);
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export function formatFee(fee?: number | null): string {
  if (fee === null || fee === undefined) return 'Discussed at consultation';
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(fee);
}

/** Groups working days into human ranges: ["MONDAY".."SATURDAY"] -> "Mon - Sat". */
export function formatWorkingDays(days: DayOfWeek[]): string {
  const sorted = DAYS_ORDER.filter((d) => days.includes(d));
  if (sorted.length === 0) return 'Closed';
  const groups: DayOfWeek[][] = [];
  for (const day of sorted) {
    const last = groups[groups.length - 1];
    if (last && DAYS_ORDER.indexOf(day) === DAYS_ORDER.indexOf(last[last.length - 1]) + 1) {
      last.push(day);
    } else {
      groups.push([day]);
    }
  }
  return groups
    .map((g) => (g.length > 2 ? `${DAY_LABELS[g[0]].short} - ${DAY_LABELS[g[g.length - 1]].short}` : g.map((d) => DAY_LABELS[d].short).join(', ')))
    .join(', ');
}

/** Digits-only form suitable for tel: and wa.me links. */
export function phoneDigits(phone?: string | null): string {
  return (phone ?? '').replace(/\D/g, '');
}

export function telHref(phone?: string | null): string {
  const p = (phone ?? '').trim();
  return `tel:${p.startsWith('+') ? '+' : ''}${phoneDigits(p)}`;
}

export function whatsappHref(phone?: string | null, text?: string): string {
  const base = `https://wa.me/${phoneDigits(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "+919876543210" -> "+91 98765 43210" for display (best effort). */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const m = phone.match(/^\+91(\d{5})(\d{5})$/);
  if (m) return `+91 ${m[1]} ${m[2]}`;
  return phone;
}
