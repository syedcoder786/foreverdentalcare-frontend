import { useId } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { CalendarX2, Clock, Coffee } from 'lucide-react';
import { EASE_OUT } from '../motion/Reveal';
import { useAvailability } from '../../hooks/usePublicData';
import { formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';
import { Alert, ErrorMessage } from '../ui/Alert';
import { Skeleton } from '../ui/Spinner';
import type { SlotView } from '../../types';

interface SlotPickerProps {
  doctorId?: number;
  serviceId?: number;
  date?: string;
  value?: string;
  onChange: (time: string) => void;
  error?: string;
  label?: string;
}

function groupSlots(slots: SlotView[]) {
  const groups: Record<'Morning' | 'Afternoon' | 'Evening', SlotView[]> = { Morning: [], Afternoon: [], Evening: [] };
  for (const s of slots) {
    const hour = Number(s.time.slice(0, 2));
    if (hour < 12) groups.Morning.push(s);
    else if (hour < 17) groups.Afternoon.push(s);
    else groups.Evening.push(s);
  }
  return Object.entries(groups).filter(([, list]) => list.length > 0) as Array<[string, SlotView[]]>;
}

/**
 * Shows the selected doctor's free slots for a date, computed by the backend from THAT doctor's schedule,
 * breaks, blocked time and existing appointments. Only bookable slots are offered.
 */
export function SlotPicker({ doctorId, serviceId, date, value, onChange, error, label = 'Available times' }: SlotPickerProps) {
  const { data, isLoading, isError, error: queryError, refetch } = useAvailability(doctorId, date, serviceId);
  const layoutGroupId = useId();

  const content = (() => {
    if (!doctorId || !date) {
      return (
        <p className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
          <Clock className="size-4" aria-hidden />
          Choose a date to see the doctor&apos;s available times.
        </p>
      );
    }
    if (isLoading) {
      return (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true" aria-label="Loading available times">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      );
    }
    if (isError) return <ErrorMessage message={getErrorMessage(queryError)} onRetry={() => refetch()} />;
    if (!data || !data.open) {
      return (
        <Alert tone="info" title="No appointments on this date">
          {data?.reason ?? 'The doctor is not available on this day.'} Please choose another date.
        </Alert>
      );
    }
    const available = data.slots.filter((s) => s.available);
    if (available.length === 0) {
      return (
        <p className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-600">
          <CalendarX2 className="size-4" aria-hidden />
          All of this doctor&apos;s slots on this date are taken. Please try another day.
        </p>
      );
    }
    return (
      <LayoutGroup id={layoutGroupId}>
        <div className="space-y-4">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              {formatTime(data.startTime)} - {formatTime(data.endTime)}
            </span>
            {data.breakStartTime && (
              <span className="inline-flex items-center gap-1.5">
                <Coffee className="size-3.5" aria-hidden />
                Break {formatTime(data.breakStartTime)} - {formatTime(data.breakEndTime)}
              </span>
            )}
            {data.appointmentMinutes ? <span>Appointment length: {data.appointmentMinutes} min</span> : null}
          </p>
          {groupSlots(available).map(([groupName, slots], groupIndex) => (
            <motion.div
              key={`${date}-${groupName}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: groupIndex * 0.08, ease: EASE_OUT }}
            >
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{groupName}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const selected = value === slot.time;
                  return (
                    <motion.button
                      key={slot.time}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onChange(slot.time)}
                      whileTap={{ scale: 0.94 }}
                      className={cn(
                        'relative h-11 rounded-xl border text-sm font-medium transition-colors',
                        selected ? 'border-transparent text-white' : 'border-slate-200 bg-surface text-ink hover:border-brand-400 hover:bg-brand-50',
                      )}
                    >
                      {selected && (
                        <motion.span
                          layoutId="slot-highlight"
                          className="absolute inset-0 rounded-xl bg-brand-700 shadow-soft dark:shadow-glow"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative">{formatTime(slot.time)}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </LayoutGroup>
    );
  })();

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        <span className="text-red-500" aria-hidden>
          *
        </span>
      </legend>
      {content}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
