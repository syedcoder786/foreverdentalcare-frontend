import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, BlockView, WeeklyDay } from '../../../types';
import { useAdminDoctors, useCalendar } from '../../../hooks/useAdminData';
import { useSite } from '../../../hooks/usePublicData';
import { addDays, addMonths, dayOfWeek, daysBetween, endOfMonth, startOfMonth, startOfWeek, todayInZone } from '../../../utils/dates';
import { formatDate, formatTime } from '../../../utils/format';
import { getErrorMessage } from '../../../utils/errors';
import { doctorColor } from '../doctorColors';
import { Button } from '../../ui/Button';
import { ErrorMessage } from '../../ui/Alert';
import { Select } from '../../ui/FormField';
import { Skeleton } from '../../ui/Spinner';
import { AppointmentDetailsModal } from '../AppointmentDetailsModal';
import { DoctorDayView } from './DoctorDayView';
import { cn } from '../../../utils/cn';

type View = 'day' | 'week' | 'month';

const STATUS_STYLE: Record<Appointment['status'], string> = {
  PENDING: 'opacity-100',
  CONFIRMED: 'opacity-100 font-semibold',
  COMPLETED: 'opacity-70',
  CANCELLED: 'opacity-40 line-through',
};

/**
 * Consolidated calendar. "All doctors" compares every doctor's schedule side by side (colour-coded);
 * choosing one doctor shows only that doctor's independent calendar.
 */
export function CalendarView({ initialDoctorId }: { initialDoctorId?: number }) {
  const { clinic } = useSite();
  const today = todayInZone(clinic.timezone);
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(today);
  const [doctorId, setDoctorId] = useState<number | undefined>(initialDoctorId);
  const [selected, setSelected] = useState<number | null>(null);
  const doctors = useAdminDoctors();
  const orderedIds = (doctors.data ?? []).map((d) => d.id);

  const [from, to] = useMemo(() => {
    if (view === 'day') return [anchor, anchor];
    if (view === 'week') return [startOfWeek(anchor), addDays(startOfWeek(anchor), 6)];
    return [startOfWeek(startOfMonth(anchor)), addDays(startOfWeek(endOfMonth(anchor)), 6)];
  }, [view, anchor]);

  const { data, isLoading, isError, error, refetch, isFetching } = useCalendar(from, to, doctorId);
  const move = (dir: number) => setAnchor((a) => (view === 'day' ? addDays(a, dir) : view === 'week' ? addDays(a, 7 * dir) : addMonths(a, dir)));
  const title = view === 'month'
    ? new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${startOfMonth(anchor)}T00:00:00Z`))
    : view === 'week' ? `${formatDate(from, { weekday: undefined })} - ${formatDate(to, { weekday: undefined })}` : formatDate(anchor, { weekday: 'long' });

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    (data?.appointments ?? []).forEach((a) => map.set(a.appointmentDate, [...(map.get(a.appointmentDate) ?? []), a]));
    return map;
  }, [data]);
  const blocksByDay = useMemo(() => {
    const map = new Map<string, BlockView[]>();
    (data?.blocks ?? []).forEach((b) => map.set(b.date, [...(map.get(b.date) ?? []), b]));
    return map;
  }, [data]);
  const worksOn = (id: number, date: string, weekly: WeeklyDay[]) =>
    weekly.find((w) => w.doctorId === id && w.dayOfWeek === dayOfWeek(date));

  const chip = (a: Appointment) => {
    const color = doctorColor(a.doctor.id, orderedIds);
    return (
      <button key={a.id} type="button" onClick={() => setSelected(a.id)}
        className={cn('block w-full truncate rounded-lg px-2 py-1 text-left text-[11px] ring-1 ring-inset transition hover:shadow-soft', color.chip, STATUS_STYLE[a.status])}
        title={`${formatTime(a.appointmentTime)} ${a.patient.fullName} - ${a.service.name} (${a.doctor.fullName}, ${a.status})`}>
        {formatTime(a.appointmentTime)} {a.patient.fullName}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1" role="tablist" aria-label="Calendar view">
          {(['day', 'week', 'month'] as View[]).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={cn('relative rounded-full px-4 py-1.5 text-sm font-medium capitalize', view === v ? 'text-ink' : 'text-slate-500')}>
              {view === v && <motion.span layoutId="cal-view" className="absolute inset-0 rounded-full bg-surface shadow-soft" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{v}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" aria-label="Previous" icon={<ChevronLeft className="size-4" />} onClick={() => move(-1)} />
          <Button size="sm" variant="ghost" onClick={() => setAnchor(today)}>Today</Button>
          <Button size="sm" variant="outline" aria-label="Next" icon={<ChevronRight className="size-4" />} onClick={() => move(1)} />
        </div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <Select label="Doctor" value={doctorId ?? ''} onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : undefined)} wrapperClassName="ml-auto min-w-52">
          <option value="">All doctors (compare)</option>
          {doctors.data?.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
        </Select>
      </div>

      {(doctors.data?.length ?? 0) > 1 && (
        <div className="flex flex-wrap gap-3 text-xs">
          {doctors.data!.map((d) => (
            <span key={d.id} className="inline-flex items-center gap-1.5 text-slate-600"><span className={cn('size-2.5 rounded-full', doctorColor(d.id, orderedIds).dot)} />{d.fullName}</span>
          ))}
          <span className="text-slate-400">· Struck through = cancelled</span>
        </div>
      )}

      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}

      {view === 'day' && doctorId ? (
        <DoctorDayView key={`${doctorId}-${anchor}`} doctorId={doctorId} initialDate={anchor} />
      ) : isLoading || !data ? (
        <Skeleton className="h-96" />
      ) : view === 'day' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.doctors.map((d) => {
            const hours = worksOn(d.id, anchor, data.weeklyHours);
            const appts = (byDay.get(anchor) ?? []).filter((a) => a.doctor.id === d.id);
            const blocks = (blocksByDay.get(anchor) ?? []).filter((b) => b.clinicWide || b.doctorId === d.id);
            return (
              <div key={d.id} className={cn('rounded-2xl border border-l-4 border-slate-200 bg-surface p-4', doctorColor(d.id, orderedIds).bar)}>
                <p className="font-semibold text-ink">{d.fullName}</p>
                <p className="text-xs text-slate-500">{hours?.active ? `${formatTime(hours.startTime)} - ${formatTime(hours.endTime)}${hours.breakStartTime ? ` · break ${formatTime(hours.breakStartTime)}-${formatTime(hours.breakEndTime)}` : ''}` : 'Not working'}</p>
                {blocks.map((b) => <p key={b.id} className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">Blocked {b.startTime ? `${formatTime(b.startTime)}-${formatTime(b.endTime)}` : 'all day'}{b.reason ? ` · ${b.reason}` : ''}</p>)}
                <div className="mt-3 space-y-1.5">{appts.length ? appts.map(chip) : <p className="text-xs text-slate-400">No appointments</p>}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={cn('relative overflow-x-auto transition-opacity', isFetching && 'opacity-60')}>
          <div className={cn('grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200')}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
            ))}
            {daysBetween(from, to).map((date) => {
              const appts = byDay.get(date) ?? [];
              const blocks = blocksByDay.get(date) ?? [];
              const outside = view === 'month' && date.slice(0, 7) !== anchor.slice(0, 7);
              const max = view === 'month' ? 3 : 12;
              return (
                <div key={date} className={cn('min-h-28 bg-surface p-1.5', view === 'week' && 'min-h-64', outside && 'bg-slate-50/60 opacity-60', date === today && 'ring-2 ring-inset ring-brand-400')}>
                  <button type="button" onClick={() => { setAnchor(date); setView('day'); }} className="mb-1 text-xs font-semibold text-slate-600 hover:text-brand-700">
                    {Number(date.slice(8))}
                  </button>
                  {blocks.map((b) => (
                    <p key={b.id} className="mb-1 truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500" title={b.reason}>
                      {b.clinicWide ? 'Holiday' : `${b.doctorName?.split(' ').slice(-1)[0]} blocked`}{b.startTime ? ` ${formatTime(b.startTime)}` : ''}
                    </p>
                  ))}
                  <div className="space-y-1">{appts.slice(0, max).map(chip)}</div>
                  {appts.length > max && (
                    <button type="button" onClick={() => { setAnchor(date); setView('day'); }} className="mt-1 text-[11px] font-semibold text-brand-700">+{appts.length - max} more</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <AppointmentDetailsModal appointmentId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
