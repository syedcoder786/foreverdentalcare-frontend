import type { ClinicSettings, DayOfWeek } from '../types';
import { DAYS_ORDER, DAY_LABELS, formatTime } from './format';

export function weekdayInZone(timeZone: string, now: Date = new Date()): DayOfWeek {
  try {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone }).format(now).toUpperCase() as DayOfWeek;
  } catch {
    return DAYS_ORDER[(now.getDay() + 6) % 7];
  }
}

/** Human summary for "today": open/closed and when the clinic next opens. */
export function todayStatus(clinic: ClinicSettings, now: Date = new Date()): { open: boolean; label: string } {
  const today = weekdayInZone(clinic.timezone, now);
  if (clinic.workingDays.includes(today)) {
    return { open: true, label: `Open today, ${formatTime(clinic.openingTime)} - ${formatTime(clinic.closingTime)}` };
  }
  const idx = DAYS_ORDER.indexOf(today);
  for (let i = 1; i <= 7; i++) {
    const next = DAYS_ORDER[(idx + i) % 7];
    if (clinic.workingDays.includes(next)) {
      return { open: false, label: `Closed today, opens ${DAY_LABELS[next].long} ${formatTime(clinic.openingTime)}` };
    }
  }
  return { open: false, label: 'Closed' };
}

export function weeklySchedule(clinic: ClinicSettings) {
  return DAYS_ORDER.map((day) => ({
    day,
    label: DAY_LABELS[day].long,
    open: clinic.workingDays.includes(day),
    hours: clinic.workingDays.includes(day) ? `${formatTime(clinic.openingTime)} - ${formatTime(clinic.closingTime)}` : 'Closed',
  }));
}
