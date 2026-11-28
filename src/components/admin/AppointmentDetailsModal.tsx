import { useEffect, useState, type ReactNode } from 'react';
import { CalendarClock, CheckCircle2, CircleCheckBig, Mail, MessageSquareText, Phone, XCircle } from 'lucide-react';
import type { AppointmentStatus } from '../../types';
import { useAppointment, useRescheduleAppointment, useUpdateAppointmentStatus } from '../../hooks/useAdminData';
import { useClinic } from '../../hooks/usePublicData';
import { Modal } from '../ui/Modal';
import { Button, LinkButton } from '../ui/Button';
import { Alert, ErrorMessage } from '../ui/Alert';
import { DetailListSkeleton } from '../ui/Skeletons';
import { StatusBadge } from '../ui/StatusBadge';
import { Input } from '../ui/FormField';
import { SlotPicker } from '../appointment/SlotPicker';
import { WhatsAppIcon } from '../layout/WhatsAppButton';
import { FeeSummary } from './AppointmentFee';
import { formatDate, formatDateTime, formatPhone, formatTime, telHref, whatsappHref } from '../../utils/format';
import { addDays, todayInZone } from '../../utils/dates';
import { getErrorMessage } from '../../utils/errors';
import { toast } from '../ui/Toast';

const ACTIONS: Record<AppointmentStatus, { label: string; variant: 'primary' | 'danger' | 'secondary'; icon: ReactNode }> = {
  CONFIRMED: { label: 'Confirm appointment', variant: 'primary', icon: <CheckCircle2 className="size-4" aria-hidden /> },
  COMPLETED: { label: 'Mark as completed', variant: 'secondary', icon: <CircleCheckBig className="size-4" aria-hidden /> },
  CANCELLED: { label: 'Cancel / reject', variant: 'danger', icon: <XCircle className="size-4" aria-hidden /> },
  PENDING: { label: 'Mark pending', variant: 'secondary', icon: null },
};

interface Props {
  appointmentId: number | null;
  onClose: () => void;
}

export function AppointmentDetailsModal({ appointmentId, onClose }: Props) {
  const { data: appt, isLoading, isError, error, refetch } = useAppointment(appointmentId);
  const statusMutation = useUpdateAppointmentStatus();
  const rescheduleMutation = useRescheduleAppointment();
  const { clinic } = useClinic();
  const today = todayInZone(clinic.timezone);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setConfirmCancel(false);
    setRescheduling(false);
    setNewDate('');
    setNewTime('');
    setNotice(null);
    statusMutation.reset();
    rescheduleMutation.reset();
    // Reset local UI state only when a different appointment is opened.
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (status: AppointmentStatus) => {
    setNotice(null);
    await statusMutation.mutateAsync({ id: appointmentId as number, status }).then(
      () => {
        setConfirmCancel(false);
        setNotice(`Appointment marked as ${status.toLowerCase()}.`);
        toast.success(`Appointment marked as ${status.toLowerCase()}.`);
      },
      () => undefined,
    );
  };

  const saveReschedule = async () => {
    if (!newDate || !newTime) return;
    setNotice(null);
    await rescheduleMutation.mutateAsync({ id: appointmentId as number, date: newDate, time: newTime }).then(
      () => {
        setRescheduling(false);
        setNotice(`Rescheduled to ${formatDate(newDate)} at ${formatTime(newTime)}.`);
        toast.success(`Rescheduled to ${formatDate(newDate)} at ${formatTime(newTime)}.`);
      },
      () => undefined,
    );
  };

  const mutationError = statusMutation.error ?? rescheduleMutation.error;

  return (
    <Modal open={appointmentId !== null} onClose={onClose} title={appt ? `Appointment #${appt.id}` : 'Appointment'} size="lg">
      {isLoading && <DetailListSkeleton label="Loading appointment" />}
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {appt && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {appt.service.name} · <span className="font-medium text-ink">{appt.doctor.fullName}</span>
              </p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {formatDate(appt.appointmentDate)} &middot; {formatTime(appt.appointmentTime)} - {formatTime(appt.endTime)}
              </p>
              <p className="mt-1 text-xs text-slate-400">{appt.service.specialtyName}</p>
            </div>
            <StatusBadge status={appt.status} className="self-start text-sm sm:self-center" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section>
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Patient</h3>
              <p className="text-lg font-semibold text-ink">{appt.patient.fullName}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-slate-400" aria-hidden />
                  <a href={telHref(appt.patient.phone)} className="hover:text-brand-700">
                    {formatPhone(appt.patient.phone)}
                  </a>
                </li>
                {appt.patient.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 text-slate-400" aria-hidden />
                    <a href={`mailto:${appt.patient.email}`} className="break-all hover:text-brand-700">
                      {appt.patient.email}
                    </a>
                  </li>
                )}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <LinkButton href={telHref(appt.patient.phone)} size="sm" variant="outline" icon={<Phone className="size-4" aria-hidden />}>
                  Call
                </LinkButton>
                <LinkButton
                  href={whatsappHref(
                    appt.patient.phone,
                    `Hello ${appt.patient.fullName}, this is ${clinic.clinicName} regarding your ${appt.service.name} appointment request on ${formatDate(appt.appointmentDate)} at ${formatTime(appt.appointmentTime)}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  variant="outline"
                  icon={<WhatsAppIcon className="size-4 text-[#25D366]" />}
                >
                  WhatsApp
                </LinkButton>
              </div>
            </section>
            <section>
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Message</h3>
              {appt.message ? (
                <p className="flex gap-2 rounded-xl border border-slate-200 p-3 text-sm whitespace-pre-line text-slate-700">
                  <MessageSquareText className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
                  {appt.message}
                </p>
              ) : (
                <p className="text-sm text-slate-400">No message provided.</p>
              )}
              <div className="mt-4"><FeeSummary appt={appt} /></div>
              <p className="mt-4 text-xs text-slate-400">Requested {formatDateTime(appt.createdAt)}</p>
              <p className="text-xs text-slate-400">Last updated {formatDateTime(appt.updatedAt)}</p>
            </section>
          </div>

          {(appt.allowedTransitions.length > 0 || appt.reschedulable) && (
            <section className="border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Actions</h3>
              {confirmCancel ? (
                <Alert
                  tone="warning"
                  title="Cancel this appointment?"
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button variant="danger" size="sm" loading={statusMutation.isPending} onClick={() => changeStatus('CANCELLED')}>
                        Yes, cancel appointment
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmCancel(false)}>
                        Keep appointment
                      </Button>
                    </div>
                  }
                >
                  The time slot will become available for other patients. Please inform the patient.
                </Alert>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {appt.allowedTransitions.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={ACTIONS[s].variant}
                      icon={ACTIONS[s].icon}
                      loading={statusMutation.isPending && statusMutation.variables?.status === s}
                      disabled={statusMutation.isPending}
                      onClick={() => (s === 'CANCELLED' ? setConfirmCancel(true) : changeStatus(s))}
                    >
                      {ACTIONS[s].label}
                    </Button>
                  ))}
                  {appt.reschedulable && !rescheduling && (
                    <Button size="sm" variant="outline" icon={<CalendarClock className="size-4" aria-hidden />} onClick={() => setRescheduling(true)}>
                      Reschedule
                    </Button>
                  )}
                </div>
              )}

              {rescheduling && (
                <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 p-4">
                  <Input
                    label="New date"
                    type="date"
                    min={today}
                    max={addDays(today, clinic.bookingWindowDays)}
                    value={newDate}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                      setNewTime('');
                    }}
                  />
                  <SlotPicker
                    label={`New time in ${appt.doctor.fullName}'s calendar`}
                    doctorId={appt.doctor.id}
                    serviceId={appt.service.id}
                    date={newDate && newDate >= today ? newDate : undefined}
                    value={newTime}
                    onChange={setNewTime}
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setRescheduling(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" disabled={!newDate || !newTime} loading={rescheduleMutation.isPending} onClick={saveReschedule}>
                      Save new time
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {notice && <Alert tone="success">{notice}</Alert>}
          {mutationError && <Alert tone="error">{getErrorMessage(mutationError)}</Alert>}
        </div>
      )}
    </Modal>
  );
}
