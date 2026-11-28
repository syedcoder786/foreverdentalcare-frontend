import { useState } from 'react';
import { motion } from 'motion/react';
import { Ban, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useDoctorDay } from '../../../hooks/useAdminData';
import { useSite } from '../../../hooks/usePublicData';
import { addDays, todayInZone } from '../../../utils/dates';
import { formatDate, formatTime } from '../../../utils/format';
import { scheduleHours, shiftRange, shiftsOf, type Shift } from '../../../utils/clinicHours';
import type { AdminDaySchedule } from '../../../types';
import { ShiftHours, ShiftIcon } from '../../ui/ShiftHours';
import { getErrorMessage } from '../../../utils/errors';
import { Button } from '../../ui/Button';
import { ErrorMessage } from '../../ui/Alert';
import { Skeleton } from '../../ui/Spinner';
import { StatusBadge } from '../../ui/StatusBadge';
import { AppointmentDetailsModal } from '../AppointmentDetailsModal';
import { cn } from '../../../utils/cn';

/** Splits the day's slots into morning / evening shift groups (one ungrouped list when there is a single shift). */
function slotGroups(data: AdminDaySchedule): Array<[Shift | null, AdminDaySchedule['slots']]> {
  const shifts = shiftsOf(scheduleHours(data));
  if (shifts.length < 2) return [[null, data.slots]];
  return [
    [shifts[0], data.slots.filter((s) => s.time < shifts[1].from)],
    [shifts[1], data.slots.filter((s) => s.time >= shifts[1].from)],
  ].filter(([, list]) => (list as AdminDaySchedule['slots']).length > 0) as Array<[Shift, AdminDaySchedule['slots']]>;
}

const SLOT_STYLES = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
  BOOKED: 'border-brand-300 bg-brand-50 text-brand-800 dark:text-brand-300',
  BLOCKED: 'border-slate-200 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgb(148_163_184/0.15)_6px,rgb(148_163_184/0.15)_12px)] text-slate-400',
  PAST: 'border-slate-100 bg-slate-50 text-slate-300',
};

/** One doctor's daily calendar: slots by status, appointments and blocked times. */
export function DoctorDayView({ doctorId, initialDate }: { doctorId: number; initialDate?: string }) {
  const { clinic } = useSite();
  const [date, setDate] = useState(initialDate ?? todayInZone(clinic.timezone));
  const [selected, setSelected] = useState<number | null>(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useDoctorDay(doctorId, date);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" aria-label="Previous day" icon={<ChevronLeft className="size-4" />} onClick={() => setDate((d) => addDays(d, -1))} />
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-9 rounded-full border border-slate-300 bg-surface px-3 text-sm text-ink" aria-label="Date" />
        <Button size="sm" variant="outline" aria-label="Next day" icon={<ChevronRight className="size-4" />} onClick={() => setDate((d) => addDays(d, 1))} />
        <Button size="sm" variant="ghost" onClick={() => setDate(todayInZone(clinic.timezone))}>Today</Button>
        <span className="ml-auto text-sm font-medium text-ink">{formatDate(date, { weekday: 'long' })}</span>
      </div>

      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data && (
        <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: isFetching ? 0.6 : 1, y: 0 }} className="space-y-5">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            {data.startTime ? (
              <>
                <ShiftHours hours={scheduleHours(data)} variant="inline" />
                <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />{data.slotDurationMinutes}-min slots</span>
              </>
            ) : (
              <span>Not working on this day.</span>
            )}
            {!data.open && data.reason && data.startTime && <span className="inline-flex items-center gap-1.5 text-amber-700"><Ban className="size-4" aria-hidden />{data.reason}</span>}
          </div>

          {data.slots.length > 0 && (
            <>
              {slotGroups(data).map(([shift, slots]) => (
              <div key={shift?.key ?? 'all'} className="space-y-2">
              {shift && (
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <ShiftIcon shift={shift} className="size-3.5" />
                  {shift.label} · <span className="font-normal normal-case">{shiftRange(shift)}</span>
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                {slots.map((s) => {
                  const appt = s.appointmentId ? data.appointments.find((a) => a.id === s.appointmentId) : undefined;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!appt}
                      onClick={() => appt && setSelected(appt.id)}
                      className={cn('rounded-xl border px-2 py-2 text-left text-xs transition', SLOT_STYLES[s.status], appt && 'cursor-pointer hover:shadow-soft')}
                      title={appt ? `${appt.patient.fullName} - ${appt.service.name}` : s.status.toLowerCase()}
                    >
                      <span className="block font-semibold">{formatTime(s.time)}</span>
                      <span className="block truncate">{appt ? appt.patient.fullName : s.status === 'AVAILABLE' ? 'Free' : s.status === 'BLOCKED' ? 'Blocked' : 'Past'}</span>
                    </button>
                  );
                })}
              </div>
              </div>
              ))}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {(['AVAILABLE', 'BOOKED', 'BLOCKED', 'PAST'] as const).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5"><span className={cn('size-3 rounded border', SLOT_STYLES[k])} />{k.charAt(0) + k.slice(1).toLowerCase()}</span>
                ))}
              </div>
            </>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink">Appointments ({data.appointments.length})</h4>
            {data.appointments.length === 0 ? (
              <p className="text-sm text-slate-500">No appointments on this day.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {data.appointments.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => setSelected(a.id)} className="flex w-full items-center gap-4 px-4 py-3 text-left text-sm hover:bg-slate-50">
                      <span className="w-28 shrink-0 font-semibold text-ink">{formatTime(a.appointmentTime)} - {formatTime(a.endTime)}</span>
                      <span className="min-w-0 flex-1 truncate"><span className="font-medium text-ink">{a.patient.fullName}</span> · <span className="text-slate-500">{a.service.name}</span></span>
                      <StatusBadge status={a.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data.blocks.length > 0 && (
            <p className="text-xs text-slate-500">
              Blocked: {data.blocks.map((b) => (b.startTime ? `${formatTime(b.startTime)}-${formatTime(b.endTime)}` : 'whole day') + (b.reason ? ` (${b.reason})` : '') + (b.clinicWide ? ' [clinic holiday]' : '')).join('; ')}
            </p>
          )}
        </motion.div>
      )}
      <AppointmentDetailsModal appointmentId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
