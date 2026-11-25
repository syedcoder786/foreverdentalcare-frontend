import type { AppointmentStatus } from '../../types';
import { STATUS_LABELS } from '../../utils/format';
import { cn } from '../../utils/cn';

const styles: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMED: 'bg-sky-soft-50 text-sky-soft-700 ring-sky-soft-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const dots: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-sky-soft-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-400',
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap',
        styles[status],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dots[status])} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
