import { Clock, Coffee, Moon, Sun } from 'lucide-react';
import { clinicDay, shiftRange, shiftsOf, type HoursLike, type ShiftKey } from '../../utils/clinicHours';
import { cn } from '../../utils/cn';

export type TileKey = ShiftKey | 'break';

const ICONS: Record<TileKey, { Icon: typeof Sun; tone: string }> = {
  morning: { Icon: Sun, tone: 'text-amber-500' },
  evening: { Icon: Moon, tone: 'text-indigo-400' },
  full: { Icon: Clock, tone: 'text-brand-600 dark:text-brand-300' },
  break: { Icon: Coffee, tone: 'text-slate-400' },
};

export function ShiftIcon({ shift, className }: { shift: { key: TileKey }; className?: string }) {
  const { Icon, tone } = ICONS[shift.key];
  return <Icon className={cn('shrink-0', tone, className)} aria-hidden />;
}

interface ShiftHoursProps {
  hours: HoursLike;
  /** stack: one shift per line with its label. inline: compact chips on one line. */
  variant?: 'stack' | 'inline';
  /** Hide the shift name when there is only one shift. */
  hideSingleLabel?: boolean;
  className?: string;
  empty?: string;
}

/** A doctor's morning / evening shift timings. */
export function ShiftHours({ hours, variant = 'stack', hideSingleLabel, className, empty = 'Closed' }: ShiftHoursProps) {
  const shifts = shiftsOf(hours);
  if (shifts.length === 0) return <span className={cn('text-slate-400', className)}>{empty}</span>;
  const showLabel = !(hideSingleLabel && shifts.length === 1);

  return (
    <span className={cn(variant === 'inline' ? 'inline-flex flex-wrap items-center gap-x-3 gap-y-1' : 'flex flex-col gap-1', className)}>
      {shifts.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <ShiftIcon shift={s} className="size-3.5" />
          {showLabel && <span className="font-medium">{s.short}</span>}
          <span className={showLabel && variant === 'stack' ? 'opacity-80' : undefined}>{shiftRange(s)}</span>
        </span>
      ))}
    </span>
  );
}

/** Clinic hours: "10:00 AM – 9:00 PM" with the break, if any. */
export function ClinicHours({ hours, variant = 'stack', className, empty = 'Closed' }: Omit<ShiftHoursProps, 'hideSingleLabel'>) {
  const d = clinicDay(hours);
  if (!d) return <span className={cn('text-slate-400', className)}>{empty}</span>;
  return (
    <span className={cn(variant === 'inline' ? 'inline-flex flex-wrap items-center gap-x-3 gap-y-1' : 'flex flex-col gap-1', className)}>
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <ShiftIcon shift={{ key: 'full' }} className="size-3.5" />
        {shiftRange({ from: d.open, to: d.close })}
      </span>
      {d.break && (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap opacity-80">
          <ShiftIcon shift={{ key: 'break' }} className="size-3.5" />
          Break {shiftRange(d.break)}
        </span>
      )}
    </span>
  );
}
