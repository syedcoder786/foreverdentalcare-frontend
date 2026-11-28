import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CalendarPlus, ChevronLeft, ChevronRight, Flame, Sparkles, Timer } from 'lucide-react';
import type { DentalService, ServiceOffer } from '../../types';
import { useServices } from '../../hooks/usePublicData';
import { useNow } from '../../hooks/useNow';
import { discountedFee, hasFee, useFirstVisitOffer } from '../../hooks/useFirstVisitOffer';
import { LinkButton } from '../ui/Button';
import { bookHref } from './TreatmentOffers';
import { formatRupees } from '../../utils/format';
import { countdownParts, liveOffer, offerPhase, offerRange, shortDate } from '../../utils/offers';
import { cn } from '../../utils/cn';

const SLIDE_MS = 7000;
const HEADLINE = 'font-display text-[2.6rem] leading-[1.08] font-semibold text-ink sm:text-6xl lg:text-[4.25rem]';
const PILL = 'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur';
const PILL_OFFER = `${PILL} border border-amber-200 bg-amber-50/90 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300`;
const BODY = 'mt-6 max-w-xl text-lg leading-relaxed text-muted';
const PRIMARY = 'shadow-lg shadow-brand-700/25 hover:-translate-y-0.5 dark:shadow-brand-400/20';

function FirstVisitSlide({ percent }: { percent: number }) {
  return (
    <div>
      <p className={PILL_OFFER}>
        <Sparkles className="size-3.5" aria-hidden />
        Online booking offer
      </p>
      <h2 className={cn('mt-6', HEADLINE)}>
        {percent}% off your <span className="text-gradient-brand">first visit.</span>
      </h2>
      <p className={BODY}>
        Book your first appointment online and save {percent}% on the doctor&apos;s consultation fee.{' '}
        <strong className="font-semibold text-ink">Hurry, book before the slots fill up.</strong>
      </p>
      <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <LinkButton to="/book" size="lg" className={PRIMARY} icon={<CalendarPlus className="size-5" aria-hidden />}>
          Claim {percent}% off
        </LinkButton>
        <LinkButton to="/doctors" size="lg" variant="outline" icon={<ArrowRight className="size-4" aria-hidden />}>
          See our doctors
        </LinkButton>
      </div>
    </div>
  );
}

function TreatmentSlide({ service, offer, now }: { service: DentalService; offer: ServiceOffer; now: number }) {
  const phase = offerPhase(offer, now);
  const p = countdownParts(phase === 'scheduled' ? offer.startsAt : offer.endsAt, now);
  const lastDay = phase === 'active' && p.days === 0;
  const fee = service.consultationFee;
  const clock = `${p.days > 0 ? `${p.days}d ` : ''}${String(p.hours).padStart(2, '0')}h ${String(p.minutes).padStart(2, '0')}m ${String(p.seconds).padStart(2, '0')}s`;
  return (
    <div>
      <p className={PILL_OFFER}>
        {phase === 'active' ? (
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        ) : (
          <Sparkles className="size-3.5" aria-hidden />
        )}
        {phase === 'active' ? `Limited-time offer · till ${shortDate(offer.endDate)}` : `Coming ${shortDate(offer.startDate)}`}
      </p>
      <h2 className={cn('mt-6', HEADLINE)}>
        {offer.percent}% off <span className="text-gradient-brand">{service.name}.</span>
      </h2>
      <p className={BODY}>
        For appointments {offerRange(offer)}
        {hasFee(fee) && (
          <>
            {': '}
            <s className="decoration-red-400/80 decoration-2">{formatRupees(fee)}</s>{' '}
            <strong className="font-semibold text-ink">{formatRupees(discountedFee(fee, offer.percent))}</strong>
          </>
        )}
        . <strong className="font-semibold text-ink">Hurry, book before all slots are booked.</strong>
      </p>
      <p
        className={cn(
          'mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ring-1',
          lastDay
            ? 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25'
            : 'bg-surface/80 text-ink ring-slate-200 dark:ring-white/10',
        )}
        role="timer"
      >
        {lastDay ? <Flame className="size-4" aria-hidden /> : <Timer className="size-4" aria-hidden />}
        {phase === 'scheduled' ? 'Starts in' : lastDay ? 'Last day! Ends in' : 'Ends in'} {clock}
      </p>
      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <LinkButton to={bookHref(service)} size="lg" className={PRIMARY} icon={<CalendarPlus className="size-5" aria-hidden />}>
          {phase === 'active' ? 'Book now' : `Book from ${shortDate(offer.startDate)}`}
        </LinkButton>
        <LinkButton to={`/services/${service.slug}`} size="lg" variant="outline" icon={<ArrowRight className="size-4" aria-hidden />}>
          About this treatment
        </LinkButton>
      </div>
    </div>
  );
}

/**
 * Home hero text as a horizontal slider: the clinic's own headline first, then the online first-visit offer and each
 * running / upcoming treatment offer. Swipe or scroll sideways, use the arrows or dots; it auto-advances every few
 * seconds and pauses while hovered, focused or touched. With no offers it renders the headline alone.
 */
export function HeroSlides({ intro }: { intro: ReactNode }) {
  const firstVisit = useFirstVisitOffer();
  const { data: services = [] } = useServices();
  const now = useNow(1000);
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const treatments = services
    .map((s) => ({ service: s, offer: liveOffer(s.offer, now) }))
    .filter((x): x is { service: DentalService; offer: ServiceOffer } => x.offer !== null)
    .sort((a, b) => {
      const pa = offerPhase(a.offer, now) === 'active' ? 0 : 1;
      const pb = offerPhase(b.offer, now) === 'active' ? 0 : 1;
      return pa - pb || b.offer.percent - a.offer.percent;
    })
    .slice(0, 4);

  const slides: { key: string; label: string; node: ReactNode }[] = [{ key: 'intro', label: 'Welcome', node: intro }];
  if (firstVisit && !firstVisit.pendingFirst) {
    slides.push({ key: 'first-visit', label: `${firstVisit.percent}% off first visit`, node: <FirstVisitSlide percent={firstVisit.percent} /> });
  }
  treatments.forEach(({ service, offer }) =>
    slides.push({ key: `t-${service.id}`, label: `${offer.percent}% off ${service.name}`, node: <TreatmentSlide service={service} offer={offer} now={now} /> }),
  );
  const count = slides.length;
  const current = Math.min(active, count - 1);

  const go = useCallback(
    (i: number) => {
      const el = scroller.current;
      if (el) el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    },
    [reduce],
  );

  const onScroll = () => {
    const el = scroller.current;
    if (el && el.clientWidth) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  // Auto-advance (wraps to the first slide).
  useEffect(() => {
    if (count < 2 || paused || reduce) return;
    const t = window.setTimeout(() => go((current + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [current, count, paused, reduce, go]);

  // Keep the visible slide aligned when the window is resized.
  useEffect(() => {
    const onResize = () => go(current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [current, go]);

  if (count === 1) return <>{intro}</>;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlights and offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={scroller}
        onScroll={onScroll}
        className="relative -mx-3 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <div
            key={s.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${s.label}`}
            className="w-full shrink-0 snap-start snap-always px-3 pt-1 pb-5"
          >
            {s.node}
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => go((current - 1 + count) % count)}
          aria-label="Previous slide"
          className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-surface/70 text-ink backdrop-blur transition hover:border-brand-300 dark:border-white/10"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}: ${s.label}`}
              aria-current={i === current}
              className={cn(
                'relative h-2 overflow-hidden rounded-full transition-all duration-300',
                i === current ? 'w-10 bg-slate-200 dark:bg-white/10' : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-white/20',
              )}
            >
              {i === current && (
                <motion.span
                  key={`${s.key}-${paused}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-600 dark:bg-brand-400"
                  initial={{ width: paused || reduce ? '100%' : '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: paused || reduce ? 0 : SLIDE_MS / 1000, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go((current + 1) % count)}
          aria-label="Next slide"
          className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-surface/70 text-ink backdrop-blur transition hover:border-brand-300 dark:border-white/10"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <span className="ml-1 hidden truncate text-xs font-medium text-muted sm:inline">{slides[current]?.label}</span>
      </div>
    </div>
  );
}
