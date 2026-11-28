import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type Variants,
} from 'motion/react';
import { ArrowRight, BellRing, Check, ChevronLeft, ChevronRight, Clock, Hourglass, MapPin, Navigation, Phone, Stethoscope } from 'lucide-react';
import { WhatsAppIcon } from '../layout/WhatsAppButton';
import type { PatientAppointment } from '../../types';
import { usePatientAuth } from '../../context/PatientAuthContext';
import { usePatientAppointments } from '../../hooks/usePatientData';
import { useSite } from '../../hooks/usePublicData';
import { StatusBadge } from '../ui/StatusBadge';
import { EASE_OUT } from '../motion/Reveal';
import { formatDate, formatPhone, formatTime, telHref, whatsappHref } from '../../utils/format';
import { directionsHref } from '../../utils/maps';
import { appointmentEnd, appointmentStart as startOf, isUpcoming } from '../../utils/appointments';
import { useNow } from '../../hooks/useNow';
import { cn } from '../../utils/cn';

const datePart = (date: string, opts: Intl.DateTimeFormatOptions) =>
  formatDate(date, { weekday: undefined, day: undefined, month: undefined, year: undefined, ...opts });

const container: Variants = {
  hidden: { opacity: 0, y: -24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: EASE_OUT, staggerChildren: 0.08, delayChildren: 0.2 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

const SLIDE_MS = 7000;

const slideVariants: Variants = {
  hidden: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 90 : -90, filter: 'blur(4px)' }),
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE_OUT, staggerChildren: 0.07, delayChildren: 0.05 } },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -90 : 90, filter: 'blur(4px)', transition: { duration: 0.3, ease: 'easeIn' } }),
};

/**
 * Home page banner (just under the navbar) for a signed-in patient's upcoming appointments, with a live countdown.
 * With more than one appointment it becomes a slider: story-style progress bars, auto-advance, arrows, dots and swipe.
 */
export function NextAppointmentCard() {
  const { status, patient } = usePatientAuth();
  const appointments = usePatientAppointments();
  const reduce = useReducedMotion();
  const now = useNow();
  const upcoming = (appointments.data ?? [])
    .filter((a) => isUpcoming(a, now))
    .sort((a, b) => startOf(a) - startOf(b));
  const count = upcoming.length;
  const [[index, dir], setSlide] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(0);
  const current = upcoming[Math.min(index, Math.max(0, count - 1))];

  const go = (to: number, direction: number) => {
    if (count < 2) return;
    progress.set(0);
    setSlide([(to + count) % count, direction]);
  };

  // Keep the index valid when an appointment drops off the list.
  useEffect(() => {
    if (index >= count && count > 0) setSlide([0, 1]);
  }, [index, count]);

  // Story-style timer: fills the active bar, then moves to the next slide. Paused on hover/focus.
  useAnimationFrame((_, delta) => {
    if (count < 2 || paused || reduce) return;
    const next = progress.get() + delta / SLIDE_MS;
    if (next >= 1) go(index + 1, 1);
    else progress.set(next);
  });

  if (status !== 'authenticated' || !current) return null;
  const firstName = patient?.fullName.split(' ')[0];
  const position = upcoming.indexOf(current);
  const headingFor = (i: number) =>
    i === 0 ? (firstName ? `${firstName}, your next visit` : 'Your next visit') : `Coming up after · visit ${i + 1} of ${count}`;

  return (
    <div
      className="container-page relative z-10 pt-3 pb-4 sm:pt-6 sm:pb-8"
      role="region"
      aria-roledescription={count > 1 ? 'carousel' : undefined}
      aria-label="Your upcoming appointments"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(position + 1, 1);
        if (e.key === 'ArrowLeft') go(position - 1, -1);
      }}
    >
      <motion.div variants={container} initial="hidden" animate="show" className="relative rounded-[2rem] p-[1.5px]">
        {/* Rotating light around the border */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden>
          <div className="absolute inset-0 bg-brand-400/25" />
          <motion.div
            className="absolute top-1/2 left-1/2 aspect-square w-[160%] -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'conic-gradient(from 0deg, transparent 0%, var(--color-brand-400) 10%, #a7f3d0 14%, transparent 28%, transparent 50%, var(--color-brand-500) 62%, transparent 78%)' }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
          />
        </div>
        {/* Outer glow pulse */}
        <motion.div
          className="pointer-events-none absolute -inset-2 -z-10 rounded-[2.4rem] bg-brand-400/25 blur-2xl"
          animate={reduce ? undefined : { opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-surface/95 shadow-lift backdrop-blur-xl">
          <motion.div
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand-400/20 blur-3xl"
            animate={reduce ? undefined : { scale: [1, 1.2, 1], x: [0, -20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-60 rounded-full bg-sky-400/10 blur-3xl" aria-hidden />

          {/* Story bars: one per appointment, the active one fills up */}
          {count > 1 && (
            <div className="relative flex gap-1.5 px-4 pt-3 sm:px-6 sm:pt-4" aria-hidden>
              {upcoming.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  tabIndex={-1}
                  onClick={() => go(i, i >= position ? 1 : -1)}
                  className="group relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-slate-200/80 transition-[height] hover:h-2"
                >
                  {i < position && <span className="absolute inset-0 rounded-full bg-brand-500" />}
                  {i === position && <ActiveBar progress={progress} full={Boolean(reduce)} />}
                </button>
              ))}
            </div>
          )}

          {/* Desktop: all slides share one grid cell and invisible copies set the height to the tallest slide, so it never jumps. Phones use each slide's own height (no empty gaps). */}
          <div className="relative grid">
            {count > 1 &&
              upcoming.map((a, i) => (
                <div key={`sizer-${a.id}`} className="invisible col-start-1 row-start-1 hidden lg:block" aria-hidden inert>
                  <MotionConfig reducedMotion="always">
                    <Slide a={a} now={now} heading={headingFor(i)} />
                  </MotionConfig>
                </div>
              ))}
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={current.id}
                custom={dir}
                variants={slideVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                drag={count > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -70 || info.velocity.x < -400) go(position + 1, 1);
                  else if (info.offset.x > 70 || info.velocity.x > 400) go(position - 1, -1);
                }}
                className={cn('col-start-1 row-start-1', count > 1 && 'cursor-grab active:cursor-grabbing')}
                aria-roledescription={count > 1 ? 'slide' : undefined}
                aria-label={count > 1 ? `Appointment ${position + 1} of ${count}` : undefined}
              >
                <Slide
                  a={current}
                  now={now}
                  heading={headingFor(position)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom bar: journey of the shown appointment + slider controls */}
          <motion.div
            variants={item}
            className={cn(
              'relative items-center gap-3 border-t border-slate-100 px-4 py-2 sm:px-6 sm:py-3 dark:border-white/5',
              count > 1 ? 'flex justify-center md:justify-start' : 'hidden md:flex',
            )}
          >
            <div className="hidden min-w-0 flex-1 md:flex"><JourneyBar a={current} now={now} /></div>
            {count > 1 ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <SlideButton label="Previous appointment" onClick={() => go(position - 1, -1)}>
                  <ChevronLeft className="size-4" aria-hidden />
                </SlideButton>
                <div className="flex items-center gap-1.5 px-1">
                  {upcoming.map((a, i) => (
                    <button
                      key={a.id}
                      type="button"
                      aria-label={`Show appointment ${i + 1}`}
                      aria-current={i === position}
                      onClick={() => go(i, i >= position ? 1 : -1)}
                      className="flex h-4 items-center"
                    >
                      <motion.span
                        className={cn('block h-2 rounded-full', i === position ? 'bg-brand-500' : 'bg-slate-300 hover:bg-slate-400')}
                        animate={{ width: i === position ? 22 : 8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    </button>
                  ))}
                </div>
                <SlideButton label="Next appointment" onClick={() => go(position + 1, 1)}>
                  <ChevronRight className="size-4" aria-hidden />
                </SlideButton>
                <Link to="/profile" className="ml-2 hidden text-xs font-semibold text-brand-700 hover:underline md:inline dark:text-brand-300">
                  All
                </Link>
              </div>
            ) : (
              <Link to="/profile" className="group hidden shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:underline sm:inline-flex dark:text-brand-300">
                My appointments
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/** The filling story bar of the slide being shown. */
function ActiveBar({ progress, full }: { progress: MotionValue<number>; full: boolean }) {
  const width = useTransform(progress, (v) => `${v * 100}%`);
  return (
    <motion.span
      className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-brand-400 to-emerald-400 shadow-[0_0_10px] shadow-brand-400/70"
      style={{ width: full ? '100%' : width }}
    />
  );
}

function SlideButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-surface text-ink shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
    >
      {children}
    </motion.button>
  );
}

/** Booked -> visit progress for one appointment. */
function JourneyBar({ a, now }: { a: PatientAppointment; now: number }) {
  const reduce = useReducedMotion();
  const start = startOf(a);
  const booked = new Date(a.createdAt).getTime();
  const journey = start > booked ? Math.min(1, Math.max(0, (now - booked) / (start - booked))) : 1;
  return (
            <div className="flex min-w-0 flex-1 items-center gap-3 text-xs font-medium text-muted">
              <span className="shrink-0">{a.status === 'PENDING' ? 'Requested' : 'Booked'}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-linear-to-r from-brand-400 via-brand-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(4, journey * 100)}%` }}
                  transition={{ duration: 1.2, ease: EASE_OUT }}
                >
                  <motion.span
                    className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0_8px,rgb(255_255_255/0.25)_8px_16px)]"
                    animate={reduce ? undefined : { backgroundPositionX: ['0px', '32px'] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              </div>
              <span className="shrink-0 font-semibold text-ink">Visit</span>
            </div>
  );
}

/** The content of one appointment slide. */
function Slide({ a, now, heading }: { a: PatientAppointment; now: number; heading: string }) {
  const { clinic } = useSite();
  const reduce = useReducedMotion();
  const start = startOf(a);
  const left = Math.max(0, start - now);
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const mins = Math.floor((left % 3_600_000) / 60_000);
  const secs = Math.floor((left % 60_000) / 1000);
  const live = left === 0;
  const soon = !live && left < 3 * 3_600_000;
  const endsIn = Math.max(0, Math.ceil((appointmentEnd(a) - now) / 60_000));
  const pending = a.status === 'PENDING';

  return (
    <>
      <CompactSlide a={a} pending={pending} live={live} soon={soon} left={left} endsIn={endsIn} />
          <div
            className={cn(
              'relative hidden h-full gap-6 p-5 sm:p-6 md:grid lg:min-h-50 lg:items-center lg:gap-6',
              pending ? 'lg:grid-cols-[minmax(0,1fr)_minmax(24rem,1.25fr)_auto]' : 'lg:grid-cols-[auto_1fr_auto] lg:gap-8',
            )}
          >
            {/* Date tile */}
            <motion.div variants={item} className="flex items-center gap-4">
              <motion.div
                className="relative flex w-22 shrink-0 flex-col items-center overflow-hidden rounded-3xl bg-linear-to-b from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-700/30"
                animate={reduce ? undefined : { y: [0, -5, 0], rotate: [0, -1.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="w-full bg-black/15 py-1.5 text-center text-xs font-bold tracking-[0.2em] uppercase">
                  {datePart(a.appointmentDate, { month: 'short' })}
                </span>
                <span className="pt-2 font-display text-5xl leading-none font-semibold">{datePart(a.appointmentDate, { day: 'numeric' })}</span>
                <span className="pt-1 pb-3 text-xs font-semibold tracking-wider uppercase opacity-90">{datePart(a.appointmentDate, { weekday: 'short' })}</span>
                <motion.span
                  className="absolute inset-y-0 w-1/2 skew-x-[-20deg] bg-white/25"
                  initial={{ left: '-60%' }}
                  animate={reduce ? undefined : { left: ['-60%', '160%'] }}
                  transition={{ duration: 1.4, delay: 1, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                  aria-hidden
                />
              </motion.div>

              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  <motion.span
                    animate={reduce ? undefined : { rotate: [0, -18, 14, -10, 6, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2.5 }}
                    className="inline-flex"
                  >
                    {pending ? <Hourglass className="size-4" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
                  </motion.span>
                  {pending ? heading.replace('your next visit', 'your request is in') : heading}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">{a.serviceName}</h2>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Stethoscope className="size-4 text-brand-600" aria-hidden />
                    <Link to={`/doctors/${a.doctorSlug}`} className="hover:text-brand-700 hover:underline">{a.doctorName}</Link>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-brand-600" aria-hidden />
                    {formatDate(a.appointmentDate, { weekday: 'long', month: 'long', year: undefined })}, {formatTime(a.appointmentTime)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Countdown (confirmed) or what happens next (pending) */}
            <motion.div variants={item} className={cn(pending ? 'min-w-0 lg:justify-self-stretch' : 'lg:justify-self-center')}>
              {pending ? (
                <PendingPanel />
              ) : live ? (
                <motion.div
                  className="flex items-center gap-3 rounded-2xl bg-brand-600 px-5 py-4 text-white shadow-lg shadow-brand-700/30"
                  animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex size-3 rounded-full bg-white" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-semibold whitespace-nowrap">It's time! Please come in.</span>
                    {endsIn > 0 && <span className="text-xs text-white/80">Ends in {endsIn} min</span>}
                  </span>
                </motion.div>
              ) : (
                <div>
                  <p className={cn('mb-2 text-center text-xs font-semibold tracking-wider uppercase', soon ? 'text-amber-700' : 'text-muted')}>
                    {soon ? 'Starting soon' : 'Starts in'}
                  </p>
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <TimeUnit value={days} label="Days" fraction={Math.min(1, days / 30)} hideWhenZero />
                    <TimeUnit value={hours} label="Hours" fraction={hours / 24} />
                    <Colon />
                    <TimeUnit value={mins} label="Mins" fraction={mins / 60} />
                    <Colon />
                    <TimeUnit value={secs} label="Secs" fraction={secs / 60} accent />
                  </div>
                </div>
              )}
              {!pending && <VisitFacts a={a} />}
            </motion.div>

            {/* Actions */}
            <motion.div variants={item} className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-stretch">
              <motion.a
                href={directionsHref(clinic)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get directions to the clinic on Google Maps (opens in a new tab)"
                whileHover={reduce ? undefined : { y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                className="group relative isolate inline-flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl bg-linear-to-br from-brand-400 via-brand-600 to-brand-700 py-2.5 pr-3 pl-2.5 text-left text-white shadow-xl shadow-brand-700/35 ring-1 ring-white/20 transition-shadow ring-inset hover:shadow-2xl hover:shadow-brand-500/40 focus-visible:ring-4 focus-visible:ring-brand-300"
              >
                {/* shine sweep */}
                <motion.span
                  className="absolute inset-y-0 -z-10 w-1/3 skew-x-[-20deg] bg-white/25"
                  initial={{ left: '-50%' }}
                  animate={reduce ? undefined : { left: ['-50%', '150%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                  aria-hidden
                />
                {/* icon bubble with radar pulse */}
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-md">
                  {!reduce && <span className="absolute inset-0 animate-ping rounded-xl bg-white/60 [animation-duration:2s]" aria-hidden />}
                  <MapPin className="relative size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-[0.95rem] font-bold">Get directions</span>
                  <span className="text-xs font-medium text-white/80">Open in Google Maps</span>
                </span>
                <span className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 transition-all duration-300 group-hover:bg-white group-hover:text-brand-700">
                  <Navigation className="size-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
                </span>
              </motion.a>
              {(clinic.phone || clinic.whatsappNumber) && (
                <div className={cn('grid gap-2.5', clinic.phone && clinic.whatsappNumber && 'grid-cols-2')}>
                  {clinic.phone && (
                    <motion.a
                      href={telHref(clinic.phone)}
                      aria-label={`Call the clinic on ${formatPhone(clinic.phone)}`}
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="group flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-slate-200 bg-surface/70 px-3 py-2.5 text-ink transition-colors hover:border-brand-300 hover:text-brand-700"
                    >
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                        <Phone className="size-4 text-brand-600 transition-transform group-hover:-rotate-12" aria-hidden /> Call
                      </span>
                      <span className="text-[0.7rem] whitespace-nowrap text-muted">{formatPhone(clinic.phone)}</span>
                    </motion.a>
                  )}
                  {clinic.whatsappNumber && (
                    <motion.a
                      href={whatsappHref(clinic.whatsappNumber, `Hi, I have an appointment on ${formatDate(a.appointmentDate)} at ${formatTime(a.appointmentTime)}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Message the clinic on WhatsApp at ${formatPhone(clinic.whatsappNumber)}`}
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      className="group flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-2.5 transition-colors hover:bg-[#25D366]/20"
                    >
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#128C7E] dark:text-[#5BE38F]">
                        <WhatsAppIcon className="size-4 transition-transform group-hover:scale-110" /> WhatsApp
                      </span>
                      <span className="text-[0.7rem] whitespace-nowrap text-muted">{formatPhone(clinic.whatsappNumber)}</span>
                    </motion.a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
    </>
  );
}

/** "2d 4h", "3h 12m", "12m": short countdown for the compact card. */
function shortLeft(ms: number): string {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.max(1, Math.ceil((ms % 3_600_000) / 60_000));
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Phones: one short card with only what matters (when, what, who, status) and icon actions. */
function CompactSlide({ a, pending, live, soon, left, endsIn }: { a: PatientAppointment; pending: boolean; live: boolean; soon: boolean; left: number; endsIn: number }) {
  const { clinic } = useSite();
  const iconBtn = 'flex size-8 shrink-0 items-center justify-center rounded-full ring-1 transition active:scale-95 min-[360px]:size-9';
  return (
    <div className="relative space-y-3 p-3.5 md:hidden">
      <div className="flex items-start gap-3">
        {/* mini date tile */}
        <div className="flex w-13 shrink-0 flex-col items-center overflow-hidden rounded-2xl bg-linear-to-b from-brand-500 to-brand-700 text-white shadow-md shadow-brand-700/25">
          <span className="w-full bg-black/15 py-0.5 text-center text-[9px] font-bold tracking-[0.18em] uppercase">{datePart(a.appointmentDate, { month: 'short' })}</span>
          <span className="pt-0.5 font-display text-2xl leading-none font-semibold">{datePart(a.appointmentDate, { day: 'numeric' })}</span>
          <span className="pb-1 text-[9px] font-semibold tracking-wider uppercase opacity-90">{datePart(a.appointmentDate, { weekday: 'short' })}</span>
        </div>
        {/* The status lives in the pill below, so the title gets the full width and may wrap to two lines. */}
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="line-clamp-2 font-display text-[1.05rem] leading-snug font-semibold break-words text-ink">{a.serviceName}</h2>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <Clock className="size-3.5 shrink-0 text-brand-600" aria-hidden />
            <span className="shrink-0 font-semibold text-ink">{formatTime(a.appointmentTime)}</span>
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <Stethoscope className="size-3.5 shrink-0 text-brand-600" aria-hidden />
            <Link to={`/doctors/${a.doctorSlug}`} className="min-w-0 truncate hover:underline">{a.doctorName}</Link>
          </p>
        </div>
      </div>

      {/* @container: the pill switches to shorter wording when the card is narrow (small phones), so nothing is cut off. */}
      <div className="@container flex items-center gap-1.5 min-[360px]:gap-2">
        {/* one-line status */}
        {pending ? (
          <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
            <Hourglass className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate" title="Awaiting clinic confirmation">
              <span className="@min-[19.5rem]:hidden">Awaiting</span>
              <span className="hidden @min-[19.5rem]:inline">Awaiting confirmation</span>
            </span>
          </span>
        ) : live ? (
          <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-white" /></span>
            <span className="truncate">
              <span className="@min-[19.5rem]:hidden">{endsIn > 0 ? `Now · ${endsIn}m left` : 'Come in now'}</span>
              <span className="hidden @min-[19.5rem]:inline">It&apos;s time! {endsIn > 0 ? `Ends in ${endsIn} min` : 'Please come in'}</span>
            </span>
          </span>
        ) : (
          <span
            className={cn(
              'flex min-w-0 flex-1 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ring-1',
              soon ? 'bg-amber-50 text-amber-800 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20' : 'bg-brand-50 text-brand-800 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-200 dark:ring-brand-400/20',
            )}
          >
            <BellRing className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              <span className="hidden @min-[19.5rem]:inline">{soon ? 'Soon' : 'Confirmed'} · </span>in <span className="font-bold tabular-nums">{shortLeft(left)}</span>
            </span>
          </span>
        )}

        {/* icon actions */}
        <a href={directionsHref(clinic)} target="_blank" rel="noopener noreferrer" aria-label="Get directions on Google Maps (opens in a new tab)"
          className={cn(iconBtn, 'bg-brand-600 text-white ring-brand-500 shadow-md shadow-brand-700/25')}>
          <Navigation className="size-4" aria-hidden />
        </a>
        {clinic.phone && (
          <a href={telHref(clinic.phone)} aria-label={`Call the clinic on ${formatPhone(clinic.phone)}`} className={cn(iconBtn, 'bg-surface text-brand-700 ring-slate-200 dark:text-brand-300 dark:ring-white/10')}>
            <Phone className="size-4" aria-hidden />
          </a>
        )}
        {clinic.whatsappNumber && (
          <a
            href={whatsappHref(clinic.whatsappNumber, `Hi, I have an appointment on ${formatDate(a.appointmentDate)} at ${formatTime(a.appointmentTime)}.`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Message the clinic on WhatsApp at ${formatPhone(clinic.whatsappNumber)}`}
            className={cn(iconBtn, 'bg-[#25D366]/10 text-[#128C7E] ring-[#25D366]/30 dark:text-[#5BE38F]')}
          >
            <WhatsAppIcon className="size-4" />
          </a>
        )}
      </div>
    </div>
  );
}

/** Time range and length of a confirmed appointment. */
function VisitFacts({ a }: { a: PatientAppointment }) {
  const minutes = Math.round((appointmentEnd(a) - startOf(a)) / 60_000);
  const time = `${formatTime(a.appointmentTime)}${a.endTime ? ` – ${formatTime(a.endTime)}` : ''}`;

  return (
    <dl className="mt-3 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 text-left">
      <Fact icon={<Clock className="size-4" aria-hidden />} label="Time">
        {time}
        {minutes > 0 && <span className="ml-1.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-brand-800 ring-1 ring-brand-100">{minutes} min</span>}
      </Fact>
    </dl>
  );
}

function Fact({ icon, label, className, children }: { icon: React.ReactNode; label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5 px-3 py-2', className)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[0.6rem] font-semibold tracking-wider text-muted uppercase">{label}</dt>
        <dd className="flex min-w-0 items-center text-sm font-semibold whitespace-nowrap text-ink">{children}</dd>
      </div>
    </div>
  );
}

/** Shown instead of the countdown while the clinic hasn't confirmed the time yet. */
function PendingPanel() {
  const { clinic } = useSite();
  const reduce = useReducedMotion();
  const steps = [
    { label: 'Requested', state: 'done' },
    { label: 'Clinic review', state: 'active' },
    { label: 'Confirmed', state: 'todo' },
  ] as const;

  return (
    <div className="@container relative w-full overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
      <motion.div
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-amber-300/20 blur-2xl"
        animate={reduce ? undefined : { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />

      {/* Row 1: status + contact */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <motion.span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200"
            animate={reduce ? undefined : { rotate: [0, 0, 180, 180] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.4, 0.6, 1], ease: 'easeInOut' }}
          >
            <Hourglass className="size-4.5" aria-hidden />
          </motion.span>
          <div className="min-w-0 leading-tight">
            <p className="font-semibold text-amber-800">Waiting for confirmation</p>
            <p className="mt-0.5 text-xs text-muted">We&apos;ll let you know on WhatsApp once it&apos;s confirmed.</p>
          </div>
        </div>
        {(clinic.whatsappNumber || clinic.phone) && (
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            {clinic.whatsappNumber && (
              <a
                href={whatsappHref(clinic.whatsappNumber, 'Hi, I have a question about my appointment request.')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ask about your request on WhatsApp"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-2.5 py-1.5 font-semibold whitespace-nowrap text-[#128C7E] ring-1 ring-[#25D366]/30 transition-colors hover:bg-[#25D366]/25 dark:text-[#5BE38F]"
              >
                <WhatsAppIcon className="size-3.5" /> WhatsApp
              </a>
            )}
            {clinic.phone && (
              <a
                href={telHref(clinic.phone)}
                aria-label={`Call the clinic on ${formatPhone(clinic.phone)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 font-semibold whitespace-nowrap text-ink ring-1 ring-slate-200 transition-colors hover:text-brand-700 hover:ring-brand-300"
              >
                <Phone className="size-3.5 text-brand-600" aria-hidden /> Call
              </a>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Requested -> Clinic review -> Confirmed, labels beside the dots */}
      <ol className="relative mt-3 flex items-center gap-2 border-t border-amber-200/70 pt-3" aria-label="Request status">
        {steps.map((step, i) => (
          <li key={step.label} className={cn('flex items-center gap-2', i < steps.length - 1 && 'min-w-0 flex-1')}>
            <span
              className={cn(
                'relative flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold',
                step.state === 'done' && 'bg-brand-600 text-white',
                step.state === 'active' && 'bg-amber-500 text-white',
                step.state === 'todo' && 'border border-slate-300 bg-surface text-muted',
              )}
            >
              {step.state === 'active' && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/60" aria-hidden />}
              {step.state === 'done' ? <Check className="relative size-3" aria-hidden /> : <span className="relative">{i + 1}</span>}
            </span>
            <span className={cn('text-xs font-semibold whitespace-nowrap', step.state === 'active' ? 'text-amber-800' : 'text-muted')}>
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span className="relative h-1 min-w-4 flex-1 overflow-hidden rounded-full bg-slate-200">
                {step.state === 'done' && <span className="absolute inset-0 rounded-full bg-brand-500" />}
                {step.state === 'active' && (
                  <motion.span
                    className="absolute inset-y-0 w-1/2 rounded-full bg-amber-400"
                    animate={reduce ? undefined : { left: ['-50%', '100%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** One countdown unit: rolling digits plus a bar showing how full the unit is. */
function TimeUnit({ value, label, fraction, accent, hideWhenZero }: { value: number; label: string; fraction: number; accent?: boolean; hideWhenZero?: boolean }) {
  if (hideWhenZero && value === 0) return null;
  const digits = String(value).padStart(2, '0').split('');
  return (
    <div className="flex w-15 flex-col items-center sm:w-17">
      <div
        className={cn(
          'relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl border shadow-sm sm:h-16',
          accent ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50',
        )}
      >
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-slate-200/70" aria-hidden />
        {digits.map((d, i) => (
          <span key={i} className="relative inline-block h-9 w-[0.62em] overflow-hidden font-display text-3xl leading-9 font-semibold text-ink tabular-nums sm:text-[2rem]">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={d}
                className="absolute inset-0 text-center"
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                {d}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={cn('h-full rounded-full', accent ? 'bg-emerald-400' : 'bg-brand-500')}
          animate={{ width: `${Math.max(3, fraction * 100)}%` }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        />
      </div>
      <span className="mt-1 text-[0.65rem] font-semibold tracking-wider text-muted uppercase">{label}</span>
    </div>
  );
}

function Colon() {
  return (
    <motion.span
      className="pt-3 font-display text-2xl font-semibold text-brand-500 sm:pt-4"
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
      aria-hidden
    >
      :
    </motion.span>
  );
}
