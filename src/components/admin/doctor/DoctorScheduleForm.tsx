import { useEffect, useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import type { DaySchedule, DayOfWeek, SpecialHours } from '../../../types';
import { useDoctorSchedule, useSaveSchedule } from '../../../hooks/useAdminData';
import { DAYS_ORDER, DAY_LABELS } from '../../../utils/format';
import { parseApiError, getErrorMessage } from '../../../utils/errors';
import { Button } from '../../ui/Button';
import { Alert, ErrorMessage } from '../../ui/Alert';
import { PageLoader } from '../../ui/Spinner';
import { cn } from '../../../utils/cn';

const SLOT_OPTIONS = [15, 20, 30, 45, 60];
const inputCls = 'h-10 rounded-lg border border-slate-300 bg-surface px-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:opacity-40';

function TimeInput({ value, onChange, disabled, label }: { value?: string | null; onChange: (v: string) => void; disabled?: boolean; label: string }) {
  return <input type="time" aria-label={label} className={inputCls} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
}

function SlotSelect({ value, onChange, disabled, label }: { value: number; onChange: (v: number) => void; disabled?: boolean; label: string }) {
  const options = SLOT_OPTIONS.includes(value) ? SLOT_OPTIONS : [...SLOT_OPTIONS, value].sort((a, b) => a - b);
  return (
    <select aria-label={label} className={inputCls} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))}>
      {options.map((m) => <option key={m} value={m}>{m} min</option>)}
    </select>
  );
}

/** Edits ONE doctor's weekly hours, breaks, appointment duration and date-specific special hours. */
export function DoctorScheduleForm({ doctorId, onSaved }: { doctorId: number; onSaved: (message: string) => void }) {
  const { data, isLoading, isError, error, refetch } = useDoctorSchedule(doctorId);
  const save = useSaveSchedule();
  const [weekly, setWeekly] = useState<DaySchedule[]>([]);
  const [special, setSpecial] = useState<SpecialHours[]>([]);

  useEffect(() => {
    if (data) {
      setWeekly(DAYS_ORDER.map((d) => data.weekly.find((w) => w.dayOfWeek === d)!).filter(Boolean));
      setSpecial(data.specialHours);
    }
  }, [data]);

  if (isLoading) return <PageLoader label="Loading schedule..." />;
  if (isError) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const updateDay = (day: DayOfWeek, patch: Partial<DaySchedule>) =>
    setWeekly((w) => w.map((d) => (d.dayOfWeek === day ? { ...d, ...patch } : d)));
  const copyToAll = (source: DaySchedule) =>
    setWeekly((w) => w.map((d) => (d.active ? { ...source, dayOfWeek: d.dayOfWeek, active: true } : d)));
  const updateSpecial = (i: number, patch: Partial<SpecialHours>) => setSpecial((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const onSave = async () => {
    const clean = (v?: string | null) => (v ? v : null);
    try {
      const res = await save.mutateAsync({
        id: doctorId,
        weekly: weekly.map((d) => ({ ...d, breakStartTime: clean(d.breakStartTime), breakEndTime: clean(d.breakEndTime) })),
        specialHours: special.map((s) => ({ ...s, breakStartTime: clean(s.breakStartTime), breakEndTime: clean(s.breakEndTime) })),
      });
      onSaved(res.message ?? 'Schedule saved');
    } catch {
      /* rendered below */
    }
  };

  return (
    <div className="space-y-8">
      {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}

      <section>
        <h3 className="font-semibold text-ink">Weekly schedule</h3>
        <p className="mt-1 text-sm text-slate-500">Only this doctor&apos;s calendar is affected. Patients see slots of the chosen length within these hours, excluding the break.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left">Day</th>
                <th className="px-3 py-2.5 text-left">Working</th>
                <th className="px-3 py-2.5 text-left">Hours</th>
                <th className="px-3 py-2.5 text-left">Break (optional)</th>
                <th className="px-3 py-2.5 text-left">Appointment</th>
                <th className="px-3 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weekly.map((d) => (
                <tr key={d.dayOfWeek} className={cn(!d.active && 'bg-slate-50/50')}>
                  <td className="px-3 py-2.5 font-medium text-ink">{DAY_LABELS[d.dayOfWeek].long}</td>
                  <td className="px-3 py-2.5">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" className="size-4 accent-brand-700" checked={d.active} onChange={(e) => updateDay(d.dayOfWeek, { active: e.target.checked })} />
                      <span className="text-slate-600">{d.active ? 'Yes' : 'Weekly off'}</span>
                    </label>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TimeInput label={`${d.dayOfWeek} start`} value={d.startTime} disabled={!d.active} onChange={(v) => updateDay(d.dayOfWeek, { startTime: v })} />
                      <span className="text-slate-400">–</span>
                      <TimeInput label={`${d.dayOfWeek} end`} value={d.endTime} disabled={!d.active} onChange={(v) => updateDay(d.dayOfWeek, { endTime: v })} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <TimeInput label={`${d.dayOfWeek} break start`} value={d.breakStartTime} disabled={!d.active} onChange={(v) => updateDay(d.dayOfWeek, { breakStartTime: v })} />
                      <span className="text-slate-400">–</span>
                      <TimeInput label={`${d.dayOfWeek} break end`} value={d.breakEndTime} disabled={!d.active} onChange={(v) => updateDay(d.dayOfWeek, { breakEndTime: v })} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <SlotSelect label={`${d.dayOfWeek} slot length`} value={d.slotDurationMinutes} disabled={!d.active} onChange={(v) => updateDay(d.dayOfWeek, { slotDurationMinutes: v })} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {d.active && (
                      <Button size="sm" variant="ghost" icon={<Copy className="size-3.5" aria-hidden />} onClick={() => copyToAll(d)} title="Copy these hours to all working days">
                        Copy
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-ink">Special working hours</h3>
            <p className="mt-1 text-sm text-slate-500">Different hours on particular dates (replaces the weekly schedule for that date). To close a whole day, use Blocked time.</p>
          </div>
          <Button size="sm" variant="outline" icon={<Plus className="size-4" aria-hidden />}
            onClick={() => setSpecial((s) => [...s, { date: '', startTime: '10:00', endTime: '14:00', slotDurationMinutes: weekly[0]?.slotDurationMinutes ?? 30 }])}>
            Add date
          </Button>
        </div>
        {special.length > 0 && (
          <div className="mt-4 space-y-2">
            {special.map((s, i) => (
              <div key={s.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
                <input type="date" aria-label="Date" className={inputCls} value={s.date} onChange={(e) => updateSpecial(i, { date: e.target.value })} />
                <TimeInput label="Start" value={s.startTime} onChange={(v) => updateSpecial(i, { startTime: v })} />
                <span className="text-slate-400">–</span>
                <TimeInput label="End" value={s.endTime} onChange={(v) => updateSpecial(i, { endTime: v })} />
                <span className="ml-2 text-xs text-slate-500">Break</span>
                <TimeInput label="Break start" value={s.breakStartTime} onChange={(v) => updateSpecial(i, { breakStartTime: v })} />
                <TimeInput label="Break end" value={s.breakEndTime} onChange={(v) => updateSpecial(i, { breakEndTime: v })} />
                <SlotSelect label="Slot length" value={s.slotDurationMinutes} onChange={(v) => updateSpecial(i, { slotDurationMinutes: v })} />
                <input aria-label="Note" placeholder="Note" className={cn(inputCls, 'min-w-32 flex-1')} value={s.note ?? ''} onChange={(e) => updateSpecial(i, { note: e.target.value })} />
                <Button size="sm" variant="ghostDanger" aria-label="Remove special hours" icon={<Trash2 className="size-4" />} onClick={() => setSpecial((list) => list.filter((_, idx) => idx !== i))} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button loading={save.isPending} onClick={onSave}>Save schedule</Button>
      </div>
    </div>
  );
}
