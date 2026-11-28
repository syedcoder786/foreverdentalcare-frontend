import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Clock, Send, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BookingConfirmation, ClinicSettings, PatientProfile } from '../../types';
import { usePatientBookAppointment } from '../../hooks/usePatientData';
import { formatPhone } from '../../utils/format';
import { createAppointmentSchema, type AppointmentFormValues } from '../../utils/validation';
import { parseApiError } from '../../utils/errors';
import { addDays, todayInZone } from '../../utils/dates';
import { useBookAppointment, useDoctorServices, useDoctors, useSpecialties } from '../../hooks/usePublicData';
import { Checkbox, Input, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Alert, ErrorMessage } from '../ui/Alert';
import { Skeleton } from '../ui/Spinner';
import { SlotPicker } from './SlotPicker';
import { BookingSuccess } from './BookingSuccess';
import { FeeBreakdown, FeeWithOffer } from '../offer/FirstVisitOffer';
import { TreatmentFee, TreatmentOfferTag } from '../offer/TreatmentOffers';
import { DoctorAvatar } from '../doctors/DoctorCard';
import { CmsIcon } from '../content/CmsIcon';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

export interface BookingPrefill {
  specialty?: string; // slug
  doctor?: string; // slug
  service?: string; // slug or id
}

interface AppointmentFormProps {
  clinic: Pick<ClinicSettings, 'timezone' | 'bookingWindowDays' | 'clinicName' | 'phone'>;
  prefill?: BookingPrefill;
  consentText?: string;
  /** Signed-in patient: their profile supplies name, phone and email, and the booking is linked to their account. */
  patient?: PatientProfile | null;
}

const FIELD_NAMES = ['fullName', 'phone', 'email', 'specialtyId', 'doctorId', 'serviceId', 'appointmentDate', 'appointmentTime', 'message', 'consent'] as const;
const DEFAULT_CONSENT = 'I agree that the clinic may store and use the information above to process my appointment request and contact me about it.';

function Step({ n, title, done, children, disabled }: { n: number; title: string; done?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className={cn('relative pl-12 transition-opacity', disabled && 'pointer-events-none opacity-40')} aria-disabled={disabled || undefined}>
      <span
        className={cn(
          'absolute top-0 left-0 flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
          done ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-500',
        )}
        aria-hidden
      >
        {done ? <Check className="size-4" /> : n}
      </span>
      <h3 id={`step-${n}`} className="mb-3 pt-1 font-semibold text-ink">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ChoiceCard({ selected, onClick, children, label }: { selected: boolean; onClick: () => void; children: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all',
        selected
          ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200 dark:ring-brand-400/30'
          : 'border-slate-200 bg-surface hover:border-brand-300 hover:bg-brand-50/50',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Multi-step booking: specialty -> doctor -> that doctor's services -> date -> doctor's available slot -> details.
 * Every rule is re-validated by the backend; the UI only offers choices that are actually bookable.
 */
export function AppointmentForm({ clinic, prefill, consentText, patient }: AppointmentFormProps) {
  const today = todayInZone(clinic.timezone);
  const maxDate = addDays(today, clinic.bookingWindowDays);
  const schema = useMemo(() => createAppointmentSchema(today), [today]);
  const publicMutation = useBookAppointment();
  const patientMutation = usePatientBookAppointment();
  const mutation = patient ? patientMutation : publicMutation;
  const defaults = useMemo(
    () => ({
      fullName: patient?.fullName ?? '',
      phone: patient?.phone ?? '',
      email: patient?.email ?? '',
      specialtyId: '', doctorId: '', serviceId: '', appointmentDate: '', appointmentTime: '', message: '', consent: false,
    }),
    [patient],
  );
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const prefilled = useRef({ specialty: false, doctor: false, service: false });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: defaults,
  });
  register('specialtyId');
  register('doctorId');
  register('serviceId');
  register('appointmentTime');

  const specialtyId = watch('specialtyId');
  const doctorId = watch('doctorId');
  const serviceId = watch('serviceId');
  const date = watch('appointmentDate');
  const time = watch('appointmentTime');

  const specialties = useSpecialties();
  const doctors = useDoctors(specialtyId ? Number(specialtyId) : undefined);
  const services = useDoctorServices(doctorId ? Number(doctorId) : undefined, specialtyId ? Number(specialtyId) : undefined);

  const choose = (field: 'specialtyId' | 'doctorId' | 'serviceId', value: string) => {
    setValue(field, value, { shouldValidate: true });
    const resets: Record<typeof field, Array<'doctorId' | 'serviceId'>> = { specialtyId: ['doctorId', 'serviceId'], doctorId: ['serviceId'], serviceId: [] };
    resets[field].forEach((f) => setValue(f, ''));
    setValue('appointmentTime', '');
  };

  // Prefill from the URL, then auto-select when there is exactly one option.
  useEffect(() => {
    const list = specialties.data;
    if (!list || specialtyId) return;
    const wanted = !prefilled.current.specialty && prefill?.specialty ? list.find((s) => s.slug === prefill.specialty) : undefined;
    prefilled.current.specialty = true;
    if (wanted) choose('specialtyId', String(wanted.id));
    else if (list.length === 1) choose('specialtyId', String(list[0].id));
  }, [specialties.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Book with this doctor" links pass only the doctor: derive the specialty from the doctor's profile.
  useEffect(() => {
    if (specialtyId || !prefill?.doctor || prefill.specialty || !doctors.data) return;
    const doctor = doctors.data.find((d) => d.slug === prefill.doctor);
    const first = doctor?.specialties[0];
    if (first) choose('specialtyId', String(first.id));
  }, [doctors.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const list = doctors.data;
    if (!list || !specialtyId || doctorId) return;
    const wanted = !prefilled.current.doctor && prefill?.doctor ? list.find((d) => d.slug === prefill.doctor) : undefined;
    prefilled.current.doctor = true;
    if (wanted) choose('doctorId', String(wanted.id));
    else if (list.length === 1) choose('doctorId', String(list[0].id));
  }, [doctors.data, specialtyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const list = services.data;
    if (!list || !doctorId || serviceId) return;
    const wanted = !prefilled.current.service && prefill?.service
      ? list.find((s) => s.slug === prefill.service || String(s.id) === prefill.service)
      : undefined;
    prefilled.current.service = true;
    if (wanted) choose('serviceId', String(wanted.id));
    else if (list.length === 1) choose('serviceId', String(list[0].id));
  }, [services.data, doctorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // After booking, bring the confirmation into view (the submit button is far down the form).
  useEffect(() => {
    if (!confirmation) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [confirmation]);

  const selectedDoctor = doctors.data?.find((d) => String(d.id) === doctorId);
  const selectedService = services.data?.find((s) => String(s.id) === serviceId);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const booking = {
        doctorId: Number(values.doctorId),
        serviceId: Number(values.serviceId),
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime,
        message: values.message?.trim() || undefined,
        consent: values.consent,
      };
      const result = patient
        ? await patientMutation.mutateAsync(booking)
        : await publicMutation.mutateAsync({
            ...booking,
            fullName: values.fullName.trim(),
            phone: values.phone.trim(),
            email: values.email?.trim() || undefined,
          });
      setConfirmation(result);
    } catch (err) {
      const parsed = parseApiError(err);
      let mapped = false;
      for (const [field, message] of Object.entries(parsed.fieldErrors)) {
        if ((FIELD_NAMES as readonly string[]).includes(field)) {
          setError(field as (typeof FIELD_NAMES)[number], { type: 'server', message });
          mapped = true;
        }
      }
      if (parsed.status === 409) {
        setValue('appointmentTime', '');
        setError('appointmentTime', { type: 'server', message: parsed.message });
        queryClient.invalidateQueries({ queryKey: ['public', 'availability'] });
        mapped = true;
      }
      setFormError(mapped ? 'Please review the highlighted fields.' : parsed.message);
    }
  });

  if (confirmation) {
    return (
      <BookingSuccess
        confirmation={confirmation}
        clinic={clinic}
        onBookAnother={() => {
          setConfirmation(null);
          reset(defaults);
          mutation.reset();
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8" aria-label="Appointment request form">
      <AnimatePresence>{formError && <Alert tone="error" title="We couldn't submit your request">{formError}</Alert>}</AnimatePresence>

      <Step n={1} title="Choose a specialty" done={Boolean(specialtyId)}>
        {specialties.isLoading ? (
          <Skeleton className="h-16" />
        ) : specialties.isError ? (
          <ErrorMessage message={getErrorMessage(specialties.error)} onRetry={() => specialties.refetch()} />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {specialties.data?.map((s) => (
              <ChoiceCard key={s.id} selected={specialtyId === String(s.id)} onClick={() => choose('specialtyId', String(s.id))} label={s.name}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:text-brand-300">
                  <CmsIcon name={s.icon} className="size-5" />
                </span>
                <span className="font-medium text-ink">{s.name}</span>
              </ChoiceCard>
            ))}
          </div>
        )}
        {errors.specialtyId && <p role="alert" className="mt-2 text-sm text-red-600">{errors.specialtyId.message}</p>}
      </Step>

      <Step n={2} title="Choose a doctor" done={Boolean(doctorId)} disabled={!specialtyId}>
        {specialtyId && doctors.isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {doctors.data?.map((d) => (
              <ChoiceCard key={d.id} selected={doctorId === String(d.id)} onClick={() => choose('doctorId', String(d.id))} label={`${d.fullName}, ${d.professionalTitle}`}>
                <DoctorAvatar doctor={d} className="size-12 shrink-0 rounded-xl" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{d.fullName}</span>
                  <span className="block truncate text-xs text-slate-500">{d.professionalTitle}</span>
                  {d.consultationFee != null && (
                    <span className="mt-1 block text-xs text-slate-500"><FeeWithOffer fee={d.consultationFee} /></span>
                  )}
                </span>
              </ChoiceCard>
            ))}
            {specialtyId && doctors.data?.length === 0 && <p className="text-sm text-slate-500">No doctors are taking bookings for this specialty right now.</p>}
          </div>
        )}
        {errors.doctorId && <p role="alert" className="mt-2 text-sm text-red-600">{errors.doctorId.message}</p>}
      </Step>

      <Step n={3} title="Choose a treatment" done={Boolean(serviceId)} disabled={!doctorId}>
        {doctorId && services.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="grid gap-2">
            {services.data?.map((s) => (
              <ChoiceCard key={s.id} selected={serviceId === String(s.id)} onClick={() => choose('serviceId', String(s.id))} label={s.name}>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{s.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden />~{s.estimatedDuration} min</span>
                    <TreatmentFee service={s} className="text-xs" />
                    <TreatmentOfferTag offer={s.offer} />
                  </span>
                </span>
              </ChoiceCard>
            ))}
            {doctorId && services.data?.length === 0 && <p className="text-sm text-slate-500">This doctor has no bookable treatments in this specialty.</p>}
          </div>
        )}
        {errors.serviceId && <p role="alert" className="mt-2 text-sm text-red-600">{errors.serviceId.message}</p>}
      </Step>

      <Step n={4} title="Pick a date and time" done={Boolean(date && time)} disabled={!serviceId}>
        <div className="space-y-5">
          {selectedDoctor && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <UserRound className="size-4 text-brand-600" aria-hidden />
              Showing {selectedDoctor.fullName}&apos;s own calendar.
            </p>
          )}
          <Input
            label="Preferred date"
            required
            type="date"
            min={today}
            max={maxDate}
            error={errors.appointmentDate?.message}
            {...register('appointmentDate', { onChange: () => setValue('appointmentTime', '') })}
          />
          <SlotPicker
            doctorId={doctorId ? Number(doctorId) : undefined}
            serviceId={serviceId ? Number(serviceId) : undefined}
            date={date && date >= today ? date : undefined}
            value={time}
            onChange={(t) => setValue('appointmentTime', t, { shouldValidate: true })}
            error={errors.appointmentTime?.message}
          />
        </div>
      </Step>

      <Step n={5} title="Your details" done={false} disabled={!time}>
        <div className="space-y-5">
          {patient ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-400/20">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-700 text-white">
                  <UserRound className="size-5" aria-hidden />
                </span>
                <div className="leading-tight">
                  <p className="text-xs font-medium text-muted">Booking as</p>
                  <p className="font-semibold text-ink">{patient.fullName}</p>
                  <p className="text-sm text-muted">{formatPhone(patient.phone)}{patient.email ? ` · ${patient.email}` : ''}</p>
                </div>
              </div>
              <Link to="/profile" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">Edit</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input label="Full name" required autoComplete="name" placeholder="Your full name" error={errors.fullName?.message} wrapperClassName="sm:col-span-2" {...register('fullName')} />
              <Input label="Phone number" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" error={errors.phone?.message} {...register('phone')} />
              <Input label="Email" optional type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            </div>
          )}
          <Textarea label="Message" optional rows={3} placeholder="Anything you'd like the doctor to know" error={errors.message?.message} {...register('message')} />
        </div>
      </Step>

      {selectedDoctor && (
        <FeeBreakdown doctorName={selectedDoctor.fullName} doctorFee={selectedDoctor.consultationFee} service={selectedService} date={date} />
      )}

      <Checkbox label={consentText || DEFAULT_CONSENT} error={errors.consent?.message} {...register('consent')} />

      <motion.div layout className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {selectedService && selectedDoctor ? `${selectedService.name} with ${selectedDoctor.fullName}. ` : ''}
          This is a request; the clinic will contact you to confirm.
        </p>
        <Button type="submit" size="lg" loading={mutation.isPending} icon={<Send className="size-4" aria-hidden />} className="sm:min-w-56">
          {mutation.isPending ? 'Sending request...' : 'Request appointment'}
        </Button>
      </motion.div>
    </form>
  );
}
