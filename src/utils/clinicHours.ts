import type { ClinicSettings, DayOfWeek } from '../types';
import { DAYS_ORDER, DAY_LABELS, formatTime } from './format';

/*
 * Two ways hours are presented (the stored model is always start / end with an optional break):
 *
 *  - CLINIC hours (Clinic settings): opening time - closing time, with an optional break. The front desk is open the
 *    whole time; the break is shown as a break.
 *  - DOCTOR hours (Doctors -> Schedule): morning and/or evening shift.
 *      both shifts   -> start = morning start, break = morning end .. evening start, end = evening end
 *      one shift     -> start..end, no break; named Morning / Evening / Full day by when it runs
 */

export type ShiftKey = 'morning' | 'evening' | 'full';

export interface Shift {
  key: ShiftKey;
  /** "Morning shift", "Evening shift" or "Full day". */
  label: string;
  /** Short label: "Morning", "Evening", "Full day". */
  short: string;
  from: string;
  to: string;
}

export interface HoursLike {
  start?: string | null;
  end?: string | null;
  breakStart?: string | null;
  breakEnd?: string | null;
}

/** A day with its break only when the break is complete and sits inside the hours. */
const validBreak = ({ start, end, breakStart, breakEnd }: HoursLike) =>
  !!(start && end && breakStart && breakEnd && breakStart > start && breakEnd > breakStart && breakEnd < end);

const MORNING = (from: string, to: string): Shift => ({ key: 'morning', label: 'Morning shift', short: 'Morning', from, to });
const EVENING = (from: string, to: string): Shift => ({ key: 'evening', label: 'Evening shift', short: 'Evening', from, to });

/** Names a single shift by when it runs: starts from noon -> evening, ends by 2 PM -> morning, otherwise full day. */
function singleShift(from: string, to: string): Shift {
  if (from >= '12:00') return EVENING(from, to);
  if (to <= '14:00') return MORNING(from, to);
  return { key: 'full', label: 'Full day', short: 'Full day', from, to };
}

/** The shifts for a day's hours (empty when no hours are set). */
export function shiftsOf(h: HoursLike): Shift[] {
  if (!h.start || !h.end) return [];
  if (validBreak(h)) return [MORNING(h.start, h.breakStart!), EVENING(h.breakEnd!, h.end)];
  return [singleShift(h.start, h.end)];
}

export const shiftRange = (s: Pick<Shift, 'from' | 'to'>) => `${formatTime(s.from)} – ${formatTime(s.to)}`;

/** "Morning 10:00 AM – 1:00 PM · Evening 5:00 PM – 9:00 PM" (or just the range when there is one shift). */
export function shiftsText(hours: HoursLike, { separator = ' · ', alwaysLabel = false } = {}): string {
  const shifts = shiftsOf(hours);
  if (shifts.length === 1 && !alwaysLabel) return shiftRange(shifts[0]);
  return shifts.map((s) => `${s.short} ${shiftRange(s)}`).join(separator);
}

export const clinicHours = (c: Pick<ClinicSettings, 'openingTime' | 'closingTime' | 'breakStartTime' | 'breakEndTime'>): HoursLike => ({
  start: c.openingTime,
  end: c.closingTime,
  breakStart: c.breakStartTime,
  breakEnd: c.breakEndTime,
});

export const scheduleHours = (d: { startTime?: string | null; endTime?: string | null; breakStartTime?: string | null; breakEndTime?: string | null }): HoursLike => ({
  start: d.startTime,
  end: d.endTime,
  breakStart: d.breakStartTime,
  breakEnd: d.breakEndTime,
});

/* ---------- Clinic hours: open - close with an optional break ---------- */

export interface ClinicDay {
  open: string;
  close: string;
  break: { from: string; to: string } | null;
}

export function clinicDay(h: HoursLike): ClinicDay | null {
  if (!h.start || !h.end) return null;
  return { open: h.start, close: h.end, break: validBreak(h) ? { from: h.breakStart!, to: h.breakEnd! } : null };
}

/** "10:00 AM – 9:00 PM · Break 2:00 PM – 5:00 PM". */
export function clinicHoursText(h: HoursLike, { withBreak = true } = {}): string {
  const d = clinicDay(h);
  if (!d) return '';
  const range = `${formatTime(d.open)} – ${formatTime(d.close)}`;
  return withBreak && d.break ? `${range} · Break ${shiftRange(d.break)}` : range;
}

/* ---------- Editing doctor shifts: shift fields <-> stored start/end/break ---------- */

export interface ShiftFields {
  morningEnabled: boolean;
  morningStart: string;
  morningEnd: string;
  eveningEnabled: boolean;
  eveningStart: string;
  eveningEnd: string;
}

export const DEFAULT_MORNING = { start: '10:00', end: '14:00' };
export const DEFAULT_EVENING = { start: '17:00', end: '21:00' };

export function toShiftFields(h: HoursLike): ShiftFields {
  const empty: ShiftFields = { morningEnabled: false, morningStart: '', morningEnd: '', eveningEnabled: false, eveningStart: '', eveningEnd: '' };
  if (!h.start || !h.end) return { ...empty, morningEnabled: true, morningStart: DEFAULT_MORNING.start, morningEnd: DEFAULT_MORNING.end };
  if (validBreak(h)) {
    return { morningEnabled: true, morningStart: h.start, morningEnd: h.breakStart!, eveningEnabled: true, eveningStart: h.breakEnd!, eveningEnd: h.end };
  }
  return singleShift(h.start, h.end).key === 'evening'
    ? { ...empty, eveningEnabled: true, eveningStart: h.start, eveningEnd: h.end }
    : { ...empty, morningEnabled: true, morningStart: h.start, morningEnd: h.end };
}

/** Stored fields for the shifts. Call only when {@link shiftFieldsError} is null (at least one complete shift). */
export function fromShiftFields(f: ShiftFields): { start: string; end: string; breakStart: string | null; breakEnd: string | null } {
  if (f.morningEnabled && f.eveningEnabled) return { start: f.morningStart, end: f.eveningEnd, breakStart: f.morningEnd, breakEnd: f.eveningStart };
  if (f.eveningEnabled) return { start: f.eveningStart, end: f.eveningEnd, breakStart: null, breakEnd: null };
  return { start: f.morningStart, end: f.morningEnd, breakStart: null, breakEnd: null };
}

export const hasAnyShift = (f: ShiftFields) => f.morningEnabled || f.eveningEnabled;

/** Adds the morning shift, keeping it before the evening shift. */
export function addMorningShift(f: ShiftFields): ShiftFields {
  const limit = f.eveningEnabled && f.eveningStart ? f.eveningStart : '23:59';
  const start = DEFAULT_MORNING.start < limit ? DEFAULT_MORNING.start : '';
  const end = DEFAULT_MORNING.end <= limit ? DEFAULT_MORNING.end : limit > start && start ? limit : '';
  return { ...f, morningEnabled: true, morningStart: f.morningStart || start, morningEnd: f.morningEnd && f.morningEnd <= limit ? f.morningEnd : end };
}

/** Adds the evening shift. A long morning-only day (e.g. 10:00-20:00) is split into 10:00-14:00 and 17:00-20:00. */
export function addEveningShift(f: ShiftFields): ShiftFields {
  if (f.morningEnabled && f.morningStart < DEFAULT_MORNING.end && f.morningEnd > DEFAULT_EVENING.start) {
    return { ...f, morningEnd: DEFAULT_MORNING.end, eveningEnabled: true, eveningStart: DEFAULT_EVENING.start, eveningEnd: f.morningEnd };
  }
  const after = f.morningEnabled && f.morningEnd ? f.morningEnd : '00:00';
  const start = DEFAULT_EVENING.start > after ? DEFAULT_EVENING.start : '';
  return { ...f, eveningEnabled: true, eveningStart: f.eveningStart || start, eveningEnd: f.eveningEnd || (start ? DEFAULT_EVENING.end : '') };
}

export const removeMorningShift = (f: ShiftFields): ShiftFields => ({ ...f, morningEnabled: false });
export const removeEveningShift = (f: ShiftFields): ShiftFields => ({ ...f, eveningEnabled: false });

/** First problem with the shift times, or null when they are complete and in order. */
export function shiftFieldsError(f: ShiftFields): string | null {
  if (!hasAnyShift(f)) return 'Add a morning or evening shift, or mark the day as off';
  if (f.morningEnabled) {
    if (!f.morningStart || !f.morningEnd) return 'Enter the morning shift start and end';
    if (f.morningEnd <= f.morningStart) return 'Morning shift must end after it starts';
  }
  if (f.eveningEnabled) {
    if (!f.eveningStart || !f.eveningEnd) return 'Enter the evening shift start and end';
    if (f.eveningEnd <= f.eveningStart) return 'Evening shift must end after it starts';
  }
  if (f.morningEnabled && f.eveningEnabled && f.eveningStart <= f.morningEnd) return 'Evening shift must start after the morning shift ends';
  return null;
}

/** Minutes of work in the shifts (for a small summary). */
export function shiftMinutes(f: ShiftFields): number {
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  let total = 0;
  if (f.morningEnabled && f.morningStart && f.morningEnd > f.morningStart) total += m(f.morningEnd) - m(f.morningStart);
  if (f.eveningEnabled && f.eveningStart && f.eveningEnd > f.eveningStart) total += m(f.eveningEnd) - m(f.eveningStart);
  return total;
}

/* ---------- Clinic status ---------- */

export function weekdayInZone(timeZone: string, now: Date = new Date()): DayOfWeek {
  try {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(now).toUpperCase() as DayOfWeek;
  } catch {
    return DAYS_ORDER[(now.getDay() + 6) % 7];
  }
}

export function timeInZone(timeZone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone }).format(now);
  } catch {
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}

export type ClinicState = 'open' | 'break' | 'closed';

export interface ClinicStatus {
  open: boolean;
  state: ClinicState;
  /** Short headline: "Open now", "On a break", "Closed now". */
  title: string;
  /** Detail: "Closes at 9:00 PM", "Back at 5:00 PM", "Opens tomorrow at 10:00 AM". */
  detail: string;
  /** Title and detail together. */
  label: string;
}

const status = (state: ClinicState, title: string, detail: string): ClinicStatus => ({
  open: state === 'open',
  state,
  title,
  detail,
  label: detail ? `${title} · ${detail}` : title,
});

/** Live status right now: open (and when the break / closing is), on break, or closed (and when it next opens). */
export function todayStatus(clinic: ClinicSettings, now: Date = new Date()): ClinicStatus {
  const today = weekdayInZone(clinic.timezone, now);
  const day = clinicDay(clinicHours(clinic));
  if (!day || clinic.workingDays.length === 0) return status('closed', 'Closed', '');

  if (clinic.workingDays.includes(today)) {
    const t = timeInZone(clinic.timezone, now);
    const b = day.break;
    if (t < day.open) return status('closed', 'Opening soon', `Opens today at ${formatTime(day.open)}`);
    if (b && t >= b.from && t < b.to) return status('break', 'On a break', `Back at ${formatTime(b.to)}`);
    if (t < day.close) {
      if (b && t < b.from) return status('open', 'Open now', `Break at ${formatTime(b.from)}, closes ${formatTime(day.close)}`);
      return status('open', 'Open now', `Closes at ${formatTime(day.close)}`);
    }
  }
  const idx = DAYS_ORDER.indexOf(today);
  for (let i = 1; i <= 7; i++) {
    const next = DAYS_ORDER[(idx + i) % 7];
    if (clinic.workingDays.includes(next)) {
      const when = i === 1 ? 'tomorrow' : DAY_LABELS[next].long;
      return status('closed', 'Closed now', `Opens ${when} at ${formatTime(day.open)}`);
    }
  }
  return status('closed', 'Closed', '');
}

export function weeklySchedule(clinic: ClinicSettings) {
  const text = clinicHoursText(clinicHours(clinic));
  return DAYS_ORDER.map((day) => {
    const open = clinic.workingDays.includes(day);
    return { day, label: DAY_LABELS[day].long, open, hours: open ? text : 'Closed' };
  });
}
