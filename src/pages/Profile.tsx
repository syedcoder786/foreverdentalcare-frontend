import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarClock, CalendarPlus, Clock, LogOut, MapPin, Navigation, Phone, Stethoscope, UserRound } from 'lucide-react';
import type { PatientAppointment } from '../types';
import { usePatientAuth } from '../context/PatientAuthContext';
import { usePatientAppointments, useUpdatePatientProfile } from '../hooks/usePatientData';
import { useSite } from '../hooks/usePublicData';
import { PatientAuthFlow } from '../components/patient/PatientAuthFlow';
import { Seo } from '../components/content/Seo';
import { LinkButton, Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormField';
import { Alert, ErrorMessage } from '../components/ui/Alert';
import { PageLoader, Skeleton } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatDate, formatPhone, formatTime, telHref } from '../utils/format';
import { directionsHref } from '../utils/maps';
import { cn } from '../utils/cn';
import { isUpcoming } from '../utils/appointments';
import { useNow } from '../hooks/useNow';
import { getErrorMessage, parseApiError } from '../utils/errors';
import { EASE_OUT } from '../components/motion/Reveal';

export default function Profile() {
  const { status, patient } = usePatientAuth();

  if (status === 'loading') return <PageLoader label="Loading your profile..." />;

  if (status !== 'authenticated' || !patient) {
    return (
      <section className="container-page py-14 sm:py-20">
        <Seo title="My profile" noindex />
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200/80 bg-surface p-6 shadow-lift sm:p-8 dark:ring-1 dark:ring-brand-400/10">
          <PatientAuthFlow title="Sign in to your profile" />
        </div>
      </section>
    );
  }

  return <SignedInProfile />;
}

function SignedInProfile() {
  const { patient, logout } = usePatientAuth();
  const appointments = usePatientAppointments();
  const now = useNow(60_000);
  const list = appointments.data ?? [];
  const upcoming = list
    .filter((a) => isUpcoming(a, now))
    .sort((a, b) => (a.appointmentDate + a.appointmentTime).localeCompare(b.appointmentDate + b.appointmentTime));
  const past = list.filter((a) => !upcoming.includes(a));
  const initials = (patient?.fullName ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <section className="container-page py-10 sm:py-14">
      <Seo title="My profile" noindex />
      <div className="grid gap-8 lg:grid-cols-12">
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="space-y-6 lg:col-span-4"
        >
          <div className="rounded-[2rem] border border-slate-200/80 bg-surface p-6 shadow-soft dark:ring-1 dark:ring-brand-400/10">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 font-display text-2xl font-semibold text-white shadow-md">
                {initials}
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-semibold text-ink">{patient?.fullName}</h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                  <Phone className="size-3.5" aria-hidden /> {formatPhone(patient?.phone)}
                </p>
              </div>
            </div>
            <LinkButton to="/book" size="lg" fullWidth className="mt-6 shadow-lg shadow-brand-700/20" icon={<CalendarPlus className="size-5" aria-hidden />}>
              Book an appointment
            </LinkButton>
          </div>
          <ProfileForm />
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-2 px-2 text-sm font-medium text-slate-500 hover:text-red-600"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.08 }}
          className="space-y-8 lg:col-span-8"
        >
          {appointments.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          ) : appointments.isError ? (
            <ErrorMessage message={getErrorMessage(appointments.error)} onRetry={() => appointments.refetch()} />
          ) : (
            <>
              <AppointmentGroup title="Upcoming appointments" items={upcoming} empty={<EmptyUpcoming />} />
              {past.length > 0 && <AppointmentGroup title="Past and cancelled" items={past} muted />}
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function ProfileForm() {
  const { patient } = usePatientAuth();
  const mutation = useUpdatePatientProfile();
  const [fullName, setFullName] = useState(patient?.fullName ?? '');
  const [email, setEmail] = useState(patient?.email ?? '');
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(t);
  }, [saved]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    try {
      await mutation.mutateAsync({ fullName: fullName.trim(), email: email.trim() || undefined });
      setSaved(true);
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(Object.keys(parsed.fieldErrors).length ? parsed.fieldErrors : { form: parsed.message });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-[2rem] border border-slate-200/80 bg-surface p-6 shadow-soft dark:ring-1 dark:ring-brand-400/10">
      <h2 className="flex items-center gap-2 font-semibold text-ink">
        <UserRound className="size-4 text-brand-600" aria-hidden /> Your details
      </h2>
      <AnimatePresence>
        {saved && <Alert tone="success">Profile saved.</Alert>}
        {errors.form && <Alert tone="error">{errors.form}</Alert>}
      </AnimatePresence>
      <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
      <Input label="Email" optional type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      <Input label="Mobile number" value={formatPhone(patient?.phone)} disabled hint="Your mobile number is your sign-in and can't be changed here." />
      <Button type="submit" variant="outline" loading={mutation.isPending}>Save details</Button>
    </form>
  );
}

/** Only the given date parts (formatDate fills in any part not passed). */
const datePart = (date: string, opts: Intl.DateTimeFormatOptions) =>
  formatDate(date, { weekday: undefined, day: undefined, month: undefined, year: undefined, ...opts });

function AppointmentGroup({ title, items, empty, muted }: { title: string; items: PatientAppointment[]; empty?: React.ReactNode; muted?: boolean }) {
  return (
    <div>
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-ink">
        {title}
        {items.length > 0 && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 font-sans text-xs font-semibold text-brand-800 ring-1 ring-brand-100">{items.length}</span>
        )}
      </h2>
      {items.length === 0 ? (
        empty
      ) : (
        <ul className="space-y-4">
          {items.map((a) => (
            <AppointmentCard key={a.id} appointment={a} muted={muted} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AppointmentCard({ appointment: a, muted }: { appointment: PatientAppointment; muted?: boolean }) {
  const { clinic } = useSite();
  const showActions = !muted;

  return (
    <li
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-surface shadow-soft transition-shadow hover:shadow-lift dark:ring-1 dark:ring-white/5',
        muted && 'opacity-75',
      )}
    >
      {!muted && <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-400 to-brand-700" aria-hidden />}
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center self-start overflow-hidden rounded-2xl bg-brand-50 text-brand-800 ring-1 ring-brand-100 sm:w-20">
          <span className="w-full bg-brand-600 py-1 text-center text-[0.68rem] font-bold tracking-wider text-white uppercase">
            {datePart(a.appointmentDate, { month: 'short' })}
          </span>
          <span className="pt-1.5 font-display text-3xl leading-none font-semibold">{datePart(a.appointmentDate, { day: 'numeric' })}</span>
          <span className="pt-1 pb-2 text-[0.7rem] font-semibold uppercase">{datePart(a.appointmentDate, { weekday: 'short' })}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-lg leading-snug font-semibold text-ink">{a.serviceName}</p>
            <StatusBadge status={a.status} />
          </div>
          <div className="mt-2 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Stethoscope className="size-4 shrink-0 text-brand-600" aria-hidden />
              <Link to={`/doctors/${a.doctorSlug}`} className="truncate hover:text-brand-700 hover:underline">{a.doctorName}</Link>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="size-4 shrink-0 text-brand-600" aria-hidden />
              {formatTime(a.appointmentTime)}
            </p>
            <p className="flex items-center gap-2 sm:col-span-2">
              <CalendarClock className="size-4 shrink-0 text-brand-600" aria-hidden />
              {formatDate(a.appointmentDate, { weekday: 'long', month: 'long' })}
            </p>
            {showActions && clinic.address && (
              <p className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                <span className="line-clamp-2">{clinic.address}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {showActions && (clinic.phone || clinic.address) && (
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5 dark:border-white/5">
          {clinic.phone && (
            <a
              href={telHref(clinic.phone)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <Phone className="size-4 text-brand-600" aria-hidden />
              Call {formatPhone(clinic.phone)}
            </a>
          )}
          <a
            href={directionsHref(clinic)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-700/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
          >
            <Navigation className="size-4" aria-hidden />
            Get directions
          </a>
        </div>
      )}
    </li>
  );
}

function EmptyUpcoming() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/10">
      <CalendarPlus className="mx-auto size-8 text-brand-400" aria-hidden />
      <p className="mt-3 font-semibold text-ink">No upcoming appointments</p>
      <p className="mt-1 text-sm text-muted">Book a visit and it will show up here.</p>
      <LinkButton to="/book" className="mt-5" icon={<CalendarPlus className="size-4" aria-hidden />}>
        Book an appointment
      </LinkButton>
    </div>
  );
}
