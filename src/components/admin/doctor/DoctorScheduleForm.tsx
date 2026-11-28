import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CalendarClock, Copy, Plus, Trash2, Wand2, X } from 'lucide-react';
import type { DaySchedule, DayOfWeek, SpecialHours } from '../../../types';
import { useDoctorSchedule, useSaveSchedule } from '../../../hooks/useAdminData';
import { useSite } from '../../../hooks/usePublicData';
import { DAYS_ORDER, DAY_LABELS, formatDate } from '../../../utils/format';
import { parseApiError, getErrorMessage } from '../../../utils/errors';
import {
  addEveningShift,
  addMorningShift,
  clinicHours,
  fromShiftFields,
  hasAnyShift,
  removeEveningShift,
  removeMorningShift,
  scheduleHours,
  shiftFieldsError,
  shiftMinutes,
  toShiftFields,
  type ShiftFields,
} from '../../../utils/clinicHours';
import { Button } from '../../ui/Button';
import { Alert, ErrorMessage } from '../../ui/Alert';
import { PageLoader } from '../../ui/Spinner';
import { ShiftIcon } from '../../ui/ShiftHours';
import { toast } from '../../ui/Toast';
import { EASE_OUT } from '../../motion/Reveal';
import { cn } from '../../../utils/cn';

const SLOT_OPTIONS = [15, 20, 30, 45, 60];
const timeCls =
  'h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-surface px-2 text-sm text-ink tabular-nums focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:opacity-40 dark:border-white/15';

type WithShifts<T> = T & { shifts: ShiftFields };

const withShifts = <T extends DaySchedule | SpecialHours>(row: T): WithShifts<T> => ({ ...row, shifts: toShiftFields(scheduleHours(row)) });

/** Back to the stored start / end / break fields. Days off with no complete shift keep their stored hours. */
function toPayload<T extends DaySchedule | SpecialHours>({ shifts, ...rest }: WithShifts<T>, convert = true): T {
  if (!convert) return rest as unknown as T;
  const h = fromShiftFields(shifts);
  return { ...rest, startTime: h.start, endTime: h.end, breakStartTime: h.breakStart, breakEndTime: h.breakEnd } as unknown as T;
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** A shift shorter than one appointment produces no bookable slots: worth a heads-up. */
function shortShiftWarning(f: ShiftFields, slot: number): string | null {
  const short = (on: boolean, a: string, b: string) => on && a && b > a && toMin(b) - toMin(a) < slot;
  if (short(f.morningEnabled, f.morningStart, f.morningEnd)) return `Morning shift is shorter than one ${slot}-min appointment, so it will have no slots`;
  if (short(f.eveningEnabled, f.eveningStart, f.eveningEnd)) return `Evening shift is shorter than one ${slot}-min appointment, so it will have no slots`;
  return null;
}

const hoursLabel = (min: number) => (min <= 0 ? '' : `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`);

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-slate-300 dark:bg-white/15')}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 34 }} className={cn('block size-5 rounded-full bg-white shadow', checked ? 'ml-[22px]' : 'ml-0.5')} />
    </button>
  );
}

function SlotSelect({ value, onChange, disabled, label }: { value: number; onChange: (v: number) => void; disabled?: boolean; label: string }) {
  const options = SLOT_OPTIONS.includes(value) ? SLOT_OPTIONS : [...SLOT_OPTIONS, value].sort((a, b) => a - b);
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="whitespace-nowrap">Appointment</span>
      <select aria-label={label} className={cn(timeCls, 'w-auto')} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))}>
        {options.map((m) => <option key={m} value={m}>{m} min</option>)}
      </select>
    </label>
  );
}

const SHIFT_STYLE = {
  morning: {
    card: 'border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/30 dark:border-amber-300/15 dark:from-amber-400/[0.07] dark:to-transparent',
    add: 'hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700 dark:hover:bg-amber-400/5 dark:hover:text-amber-300',
  },
  evening: {
    card: 'border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-violet-50/30 dark:border-indigo-300/15 dark:from-indigo-400/[0.08] dark:to-transparent',
    add: 'hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 dark:hover:bg-indigo-400/5 dark:hover:text-indigo-300',
  },
} as const;

interface ShiftSlotProps {
  kind: 'morning' | 'evening';
  enabled: boolean;
  start: string;
  end: string;
  onTimes: (start: string, end: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  /** Removing would leave no shift (special dates): hide the remove button. */
  canRemove: boolean;
  label: string;
}

/** One shift as a small tinted card with its times, or a dashed "+ Add" button when removed. */
function ShiftSlot({ kind, enabled, start, end, onTimes, onAdd, onRemove, canRemove, label }: ShiftSlotProps) {
  const name = kind === 'morning' ? 'Morning shift' : 'Evening shift';
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {enabled ? (
        <motion.div
          key="on"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className={cn('rounded-xl border p-2.5', SHIFT_STYLE[kind].card)}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <ShiftIcon shift={{ key: kind }} className="size-3.5" />
              {name}
              {start && end > start && <span className="font-normal text-muted">· {hoursLabel(toMin(end) - toMin(start))}</span>}
            </span>
            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label} ${name.toLowerCase()}`}
                title={`Remove ${name.toLowerCase()} for this day`}
                className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <input type="time" aria-label={`${label} ${name} start`} className={timeCls} value={start} onChange={(e) => onTimes(e.target.value, end)} />
            <span className="text-slate-400">–</span>
            <input type="time" aria-label={`${label} ${name} end`} className={timeCls} value={end} onChange={(e) => onTimes(start, e.target.value)} />
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="off"
          type="button"
          onClick={onAdd}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'flex min-h-[5.25rem] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-xs font-medium text-slate-400 transition dark:border-white/10',
            SHIFT_STYLE[kind].add,
          )}
        >
          <span className="flex items-center gap-1.5">
            <Plus className="size-3.5" aria-hidden />
            <ShiftIcon shift={{ key: kind }} className="size-3.5" />
            {name}
          </span>
          <span className="text-[11px] font-normal">Not working</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** Both shift slots for one day / date. */
function ShiftPair({ f, onChange, label, keepOne }: { f: ShiftFields; onChange: (f: ShiftFields) => void; label: string; keepOne?: boolean }) {
  const both = f.morningEnabled && f.eveningEnabled;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <ShiftSlot
        kind="morning"
        label={label}
        enabled={f.morningEnabled}
        start={f.morningStart}
        end={f.morningEnd}
        onTimes={(morningStart, morningEnd) => onChange({ ...f, morningStart, morningEnd })}
        onAdd={() => onChange(addMorningShift(f))}
        onRemove={() => onChange(removeMorningShift(f))}
        canRemove={!keepOne || both}
      />
      <ShiftSlot
        kind="evening"
        label={label}
        enabled={f.eveningEnabled}
        start={f.eveningStart}
        end={f.eveningEnd}
        onTimes={(eveningStart, eveningEnd) => onChange({ ...f, eveningStart, eveningEnd })}
        onAdd={() => onChange(addEveningShift(f))}
        onRemove={() => onChange(removeEveningShift(f))}
        canRemove={!keepOne || both}
      />
    </div>
  );
}

function RowMessage({ error, warning }: { error: string | null; warning: string | null }) {
  const text = error ?? warning;
  if (!text) return null;
  return (
    <p className={cn('mt-2 flex items-center gap-1.5 text-xs', error ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300')}>
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      {text}
    </p>
  );
}

/** Edits ONE doctor's weekly shifts (morning and/or evening per day), appointment length and date-specific hours. */
export function DoctorScheduleForm({ doctorId, onSaved }: { doctorId: number; onSaved: (message: string) => void }) {
  const { data, isLoading, isError, error, refetch } = useDoctorSchedule(doctorId);
  const { clinic } = useSite();
  const save = useSaveSchedule();
  const [weekly, setWeekly] = useState<WithShifts<DaySchedule>[]>([]);
  const [special, setSpecial] = useState<WithShifts<SpecialHours>[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (data) {
      setWeekly(DAYS_ORDER.map((d) => data.weekly.find((w) => w.dayOfWeek === d)!).filter(Boolean).map(withShifts));
      setSpecial(data.specialHours.map(withShifts));
      setShowErrors(false);
    }
  }, [data]);

  if (isLoading) return <PageLoader label="Loading schedule..." />;
  if (isError) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const updateDay = (day: DayOfWeek, patch: Partial<WithShifts<DaySchedule>>) =>
    setWeekly((w) => w.map((d) => (d.dayOfWeek === day ? { ...d, ...patch } : d)));

  /** Removing the last shift turns the day off (and keeps a default shift ready for when it is switched back on). */
  const setDayShifts = (d: WithShifts<DaySchedule>, shifts: ShiftFields) => {
    if (!hasAnyShift(shifts)) {
      updateDay(d.dayOfWeek, { active: false, shifts: addMorningShift(shifts) });
      toast.info(`${DAY_LABELS[d.dayOfWeek].long} is now a day off.`);
      return;
    }
    updateDay(d.dayOfWeek, { shifts });
  };

  const setWorking = (d: WithShifts<DaySchedule>, active: boolean) =>
    updateDay(d.dayOfWeek, { active, shifts: active && !hasAnyShift(d.shifts) ? addMorningShift(d.shifts) : d.shifts });

  const copyToAll = (source: WithShifts<DaySchedule>) => {
    setWeekly((w) => w.map((d) => (d.active ? { ...d, shifts: { ...source.shifts }, slotDurationMinutes: source.slotDurationMinutes } : d)));
    toast.success(`${DAY_LABELS[source.dayOfWeek].long}'s shifts copied to every working day. Save to apply.`);
  };

  const fillFromClinic = () => {
    const shifts = toShiftFields(clinicHours(clinic));
    setWeekly((w) => w.map((d) => ({ ...d, active: clinic.workingDays.includes(d.dayOfWeek), shifts: { ...shifts } })));
    toast.success('Filled from the clinic hours: the break becomes the gap between the morning and evening shift. Review, then save.');
  };

  const updateSpecial = (i: number, patch: Partial<WithShifts<SpecialHours>>) => setSpecial((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const onSave = async () => {
    const problems: Array<[string, string | null]> = [
      ...weekly.filter((d) => d.active).map((d): [string, string | null] => [DAY_LABELS[d.dayOfWeek].long, shiftFieldsError(d.shifts)]),
      ...special.map((s): [string, string | null] => [s.date ? formatDate(s.date) : 'Special date', s.date ? shiftFieldsError(s.shifts) : 'Choose the date']),
    ];
    const dates = special.map((s) => s.date).filter(Boolean);
    const dup = dates.find((d, i) => dates.indexOf(d) !== i);
    if (dup) problems.push([formatDate(dup), 'This date is listed twice']);
    if (!weekly.some((d) => d.active)) problems.push(['Weekly schedule', 'Turn on at least one working day']);
    const bad = problems.find(([, e]) => e);
    if (bad) {
      setShowErrors(true);
      toast.error(`${bad[0]}: ${bad[1]}`, { title: 'Check the shift timings' });
      return;
    }
    try {
      const res = await save.mutateAsync({
        id: doctorId,
        weekly: weekly.map((d) => toPayload(d, d.active || !shiftFieldsError(d.shifts))),
        specialHours: special.map((s) => toPayload(s)),
      });
      setShowErrors(false);
      onSaved(res.message ?? 'Schedule saved');
    } catch {
      /* rendered below */
    }
  };

  const weeklyMinutes = weekly.filter((d) => d.active).reduce((sum, d) => sum + shiftMinutes(d.shifts), 0);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink">Weekly schedule</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Each day can have a morning shift, an evening shift or both. Remove a shift for days the doctor doesn&apos;t work it; removing both makes it a day off. Only this doctor&apos;s
              calendar is affected.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {weeklyMinutes > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">{hoursLabel(weeklyMinutes)} a week</span>
            )}
            <Button size="sm" variant="outline" icon={<Wand2 className="size-4" aria-hidden />} onClick={fillFromClinic} title="Use the clinic's opening hours, break and working days">
              Fill from clinic hours
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {weekly.map((d) => {
            const label = DAY_LABELS[d.dayOfWeek].long;
            const err = d.active && showErrors ? shiftFieldsError(d.shifts) : null;
            const warn = d.active ? shortShiftWarning(d.shifts, d.slotDurationMinutes) : null;
            return (
              <motion.div
                key={d.dayOfWeek}
                layout
                className={cn(
                  'rounded-2xl border p-3 transition-colors sm:p-4',
                  err ? 'border-red-300 dark:border-red-400/40' : 'border-slate-200 dark:border-white/10',
                  d.active ? 'bg-surface' : 'bg-slate-50/70 dark:bg-white/[0.02]',
                )}
              >
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[11rem_1fr_auto] lg:items-center">
                  <div className="flex items-center justify-between gap-3 lg:justify-start">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex size-10 items-center justify-center rounded-xl text-xs font-bold',
                          d.active ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20' : 'bg-slate-100 text-slate-400 dark:bg-white/5',
                        )}
                      >
                        {DAY_LABELS[d.dayOfWeek].short}
                      </span>
                      <div>
                        <p className={cn('text-sm font-semibold', d.active ? 'text-ink' : 'text-slate-400')}>{label}</p>
                        <p className="text-xs text-slate-500">{d.active ? hoursLabel(shiftMinutes(d.shifts)) || 'Set times' : 'Day off'}</p>
                      </div>
                    </div>
                    <Switch checked={d.active} onChange={(v) => setWorking(d, v)} label={`${label} working`} />
                  </div>

                  {d.active ? (
                    <ShiftPair f={d.shifts} label={label} onChange={(shifts) => setDayShifts(d, shifts)} />
                  ) : (
                    <div className="flex min-h-12 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-4 text-sm text-slate-400 dark:border-white/10">
                      Weekly off · patients can&apos;t book this day
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-end">
                    <SlotSelect label={`${label} appointment length`} value={d.slotDurationMinutes} disabled={!d.active} onChange={(v) => updateDay(d.dayOfWeek, { slotDurationMinutes: v })} />
                    {d.active && (
                      <Button size="sm" variant="ghost" icon={<Copy className="size-3.5" aria-hidden />} onClick={() => copyToAll(d)} title="Copy these shifts and appointment length to every working day">
                        Copy to all
                      </Button>
                    )}
                  </div>
                </div>
                <RowMessage error={err} warning={err ? null : warn} />
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-ink"><CalendarClock className="size-4 text-brand-600" aria-hidden />Special working hours</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Different shifts on particular dates; they replace the weekly schedule for that date. To close a whole day, use Blocked time.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setSpecial((s) => [...s, withShifts<SpecialHours>({ date: '', startTime: '10:00', endTime: '14:00', slotDurationMinutes: weekly.find((w) => w.active)?.slotDurationMinutes ?? 30 })])}
          >
            Add date
          </Button>
        </div>
        {special.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-white/10">No special dates. The weekly schedule applies every week.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {special.map((s, i) => {
              const label = s.date ? formatDate(s.date) : 'New date';
              const err = showErrors ? (s.date ? shiftFieldsError(s.shifts) : 'Choose the date') : null;
              const warn = shortShiftWarning(s.shifts, s.slotDurationMinutes);
              return (
                <div key={s.id ?? `new-${i}`} className={cn('rounded-2xl border p-3 sm:p-4', err ? 'border-red-300 dark:border-red-400/40' : 'border-slate-200 dark:border-white/10')}>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[11rem_1fr_auto] lg:items-start">
                    <div className="space-y-2">
                      <input type="date" aria-label="Date" className={timeCls} value={s.date} onChange={(e) => updateSpecial(i, { date: e.target.value })} />
                      <input aria-label="Note" placeholder="Note (optional)" className={timeCls} value={s.note ?? ''} onChange={(e) => updateSpecial(i, { note: e.target.value })} />
                    </div>
                    <ShiftPair f={s.shifts} label={label} keepOne onChange={(shifts) => updateSpecial(i, { shifts })} />
                    <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-end">
                      <SlotSelect label={`${label} appointment length`} value={s.slotDurationMinutes} onChange={(v) => updateSpecial(i, { slotDurationMinutes: v })} />
                      <Button size="sm" variant="ghostDanger" icon={<Trash2 className="size-4" />} onClick={() => setSpecial((list) => list.filter((_, idx) => idx !== i))}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  <RowMessage error={err} warning={err ? null : warn} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
      <div className="sticky bottom-0 -mx-1 flex justify-end border-t border-slate-100 bg-surface/95 px-1 py-4 backdrop-blur dark:border-white/5">
        <Button loading={save.isPending} onClick={onSave}>Save schedule</Button>
      </div>
    </div>
  );
}
