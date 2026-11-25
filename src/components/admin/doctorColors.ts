/** Distinct visual labels per doctor in calendars (assigned by position in the doctor list). */
const PALETTE = [
  { dot: 'bg-brand-500', chip: 'bg-brand-50 text-brand-800 ring-brand-200 dark:text-brand-300', bar: 'border-l-brand-500' },
  { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-600 ring-violet-200', bar: 'border-l-violet-500' },
  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-amber-200', bar: 'border-l-amber-500' },
  { dot: 'bg-sky-soft-500', chip: 'bg-sky-soft-50 text-sky-soft-700 ring-sky-soft-200', bar: 'border-l-sky-soft-500' },
  { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-rose-200', bar: 'border-l-rose-500' },
  { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'border-l-emerald-500' },
];

export function doctorColor(doctorId: number, orderedIds: number[]) {
  const index = Math.max(0, orderedIds.indexOf(doctorId));
  return PALETTE[index % PALETTE.length];
}
