import { motion } from 'motion/react';
import { CalendarCheck2, Clock, Hash, Phone, Stethoscope, UserRound } from 'lucide-react';
import type { BookingConfirmation, ClinicSettings } from '../../types';
import { formatDate, formatPhone, formatTime, telHref } from '../../utils/format';
import { Button, LinkButton } from '../ui/Button';

interface BookingSuccessProps {
  confirmation: BookingConfirmation;
  clinic: Pick<ClinicSettings, 'clinicName' | 'phone'>;
  onBookAnother: () => void;
}

export function BookingSuccess({ confirmation, clinic, onBookAnother }: BookingSuccessProps) {
  return (
    <div className="animate-fade-up text-center" role="status" aria-live="polite">
      <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-emerald-400/30"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.25 }}
        />
        <motion.span
          className="relative flex size-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }} />
          </svg>
        </motion.span>
      </div>
      <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Request received</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">
        Thank you. Your appointment request is <strong className="text-amber-700">pending confirmation</strong>.{' '}
        {clinic.clinicName} will contact you to confirm the time.
      </p>

      <dl className="mx-auto mt-8 grid max-w-md gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-left text-sm">
        <div className="flex items-center gap-3">
          <Hash className="size-4 text-brand-600" aria-hidden />
          <dt className="text-slate-500">Reference</dt>
          <dd className="ml-auto font-semibold text-ink">#{confirmation.referenceId}</dd>
        </div>
        <div className="flex items-center gap-3">
          <Stethoscope className="size-4 text-brand-600" aria-hidden />
          <dt className="text-slate-500">Treatment</dt>
          <dd className="ml-auto text-right font-semibold text-ink">{confirmation.serviceName}</dd>
        </div>
        <div className="flex items-center gap-3">
          <UserRound className="size-4 text-brand-600" aria-hidden />
          <dt className="text-slate-500">Doctor</dt>
          <dd className="ml-auto text-right font-semibold text-ink">{confirmation.doctorName}</dd>
        </div>
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="size-4 text-brand-600" aria-hidden />
          <dt className="text-slate-500">Date</dt>
          <dd className="ml-auto font-semibold text-ink">{formatDate(confirmation.appointmentDate)}</dd>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="size-4 text-brand-600" aria-hidden />
          <dt className="text-slate-500">Time</dt>
          <dd className="ml-auto font-semibold text-ink">
            {formatTime(confirmation.appointmentTime)} - {formatTime(confirmation.endTime)}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <LinkButton href={telHref(clinic.phone)} variant="outline" icon={<Phone className="size-4" aria-hidden />}>
          Call {formatPhone(clinic.phone)}
        </LinkButton>
        <Button variant="secondary" onClick={onBookAnother}>
          Request another appointment
        </Button>
      </div>
    </div>
  );
}
