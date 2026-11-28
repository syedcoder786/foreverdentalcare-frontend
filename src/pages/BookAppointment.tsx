import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarClock, PhoneCall, ShieldCheck, Stethoscope } from 'lucide-react';
import { useClinic, usePage } from '../hooks/usePublicData';
import { AppointmentForm } from '../components/appointment/AppointmentForm';
import { BookingOfferNote } from '../components/offer/FirstVisitOffer';
import { PatientAuthFlow } from '../components/patient/PatientAuthFlow';
import { usePatientAuth } from '../context/PatientAuthContext';
import { PageLoader } from '../components/ui/Spinner';
import { RichText } from '../components/content/Cms';
import { Seo } from '../components/content/Seo';
import { EASE_OUT, Stagger, StaggerItem } from '../components/motion/Reveal';
import { formatPhone, telHref } from '../utils/format';

const steps = [
  { icon: Stethoscope, title: 'Choose your doctor', text: 'Pick the specialty, the practitioner and a treatment they offer.' },
  { icon: CalendarClock, title: 'Pick a free slot', text: "You only see times that are free in that doctor's own calendar." },
  { icon: PhoneCall, title: 'We contact you', text: 'The clinic reviews your request and calls or messages you to confirm.' },
  { icon: ShieldCheck, title: 'Visit the clinic', text: 'Arrive a few minutes early with any previous records.' },
];

export default function BookAppointment() {
  const [params] = useSearchParams();
  const { clinic, isLoading: clinicLoading } = useClinic();
  const { section, seo, isLoading: pageLoading } = usePage('BOOK');
  const intro = section('intro');
  const emergency = section('emergency');
  const consent = section('consent');
  const { status: patientStatus, patient } = usePatientAuth();

  return (
    <section className="relative">
      <Seo seo={seo} title="Book an appointment" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-brand-50/80 to-surface dark:from-brand-500/[0.07] dark:to-transparent" />
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:py-16 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-700 uppercase dark:text-brand-300">{intro?.subtitle ?? 'Appointments'}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink">{intro?.title ?? 'Request an appointment'}</h1>
          <RichText text={intro?.body} className="mt-4 text-muted" />
          <Stagger as="ol" immediate stagger={0.12} className="mt-8 hidden space-y-5 lg:block">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <StaggerItem as="li" key={title} className="flex gap-4">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 shadow-soft ring-1 ring-slate-100 dark:text-brand-300">
                  <Icon className="size-5" aria-hidden />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white">{i + 1}</span>
                </span>
                <div>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <BookingOfferNote />
          {emergency && (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {emergency.title && <p className="font-semibold">{emergency.title}</p>}
              <RichText text={emergency.body} className="mt-1" />
              {clinic.phone && (
                <a href={telHref(clinic.phone)} className="mt-2 inline-block font-semibold underline">
                  {formatPhone(clinic.phone)}
                </a>
              )}
            </div>
          )}
        </aside>

        <motion.div className="lg:col-span-8" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 }}>
          <div className="rounded-[2rem] border border-slate-200/80 bg-surface p-5 shadow-lift sm:p-8 dark:ring-1 dark:ring-brand-400/10">
            {clinicLoading || pageLoading || patientStatus === 'loading' ? (
              <PageLoader label="Loading booking form..." />
            ) : patientStatus !== 'authenticated' ? (
              <div className="mx-auto max-w-md py-4">
                <PatientAuthFlow
                  title="First, verify your mobile"
                  subtitle="We'll send a 6-digit code to your WhatsApp. It takes 30 seconds and keeps all your visits in one place."
                />
              </div>
            ) : (
              <AppointmentForm
                clinic={clinic}
                patient={patient}
                consentText={consent?.body}
                prefill={{
                  specialty: params.get('specialty') ?? undefined,
                  doctor: params.get('doctor') ?? undefined,
                  service: params.get('service') ?? undefined,
                }}
              />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
