import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Flame, Sparkles, Timer } from 'lucide-react';
import type { DentalService, ServiceOffer } from '../../types';
import { useServices } from '../../hooks/usePublicData';
import { useNow } from '../../hooks/useNow';
import { discountedFee, hasFee } from '../../hooks/useFirstVisitOffer';
import { ServiceIcon } from '../services/ServiceIcon';
import { EASE_OUT, Reveal } from '../motion/Reveal';
import { formatFee, formatRupees } from '../../utils/format';
import { countdownParts, liveOffer, offerPhase, offerRange, shortDate } from '../../utils/offers';
import { cn } from '../../utils/cn';

const DAY_MS = 86_400_000;

export function bookHref(s: DentalService): string {
  const doctor = s.doctors.length === 1 ? `&doctor=${s.doctors[0].slug}` : '';
  return `/book?specialty=${s.specialty.slug}&service=${s.slug}${doctor}`;
}

function Unit({ value, label, urgent }: { value: number; label: string; urgent?: boolean }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col items-center rounded-xl bg-slate-900/[0.04] py-1.5 ring-1 ring-slate-900/5 dark:bg-white/[0.06] dark:ring-white/10">
      <span className={cn('font-display text-xl leading-none font-semibold tabular-nums', urgent ? 'text-red-600 dark:text-red-400' : 'text-ink')}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-semibold tracking-wider text-muted uppercase">{label}</span>
    </span>
  );
}

/** Live countdown to the offer's start (scheduled) or end (running). */
function Countdown({ offer, now }: { offer: ServiceOffer; now: number }) {
  const phase = offerPhase(offer, now);
  const target = phase === 'scheduled' ? offer.startsAt : offer.endsAt;
  const p = countdownParts(target, now);
  const urgent = phase === 'active' && Date.parse(offer.endsAt) - now < DAY_MS;
  return (
    <div>
      <p className={cn('mb-1.5 flex items-center gap-1.5 text-xs font-semibold', urgent ? 'text-red-600 dark:text-red-400' : 'text-muted')}>
        {urgent ? <Flame className="size-3.5" aria-hidden /> : <Timer className="size-3.5" aria-hidden />}
        {phase === 'scheduled' ? 'Starts in' : urgent ? 'Last day! Ends in' : 'Offer ends in'}
      </p>
      <div className="flex gap-1.5" role="timer" aria-label={`${phase === 'scheduled' ? 'Starts' : 'Ends'} in ${p.days} days ${p.hours} hours ${p.minutes} minutes`}>
        <Unit value={p.days} label="days" urgent={urgent} />
        <Unit value={p.hours} label="hrs" urgent={urgent} />
        <Unit value={p.minutes} label="min" urgent={urgent} />
        <Unit value={p.seconds} label="sec" urgent={urgent} />
      </div>
    </div>
  );
}

function OfferCard({ service, offer, now, index }: { service: DentalService; offer: ServiceOffer; now: number; index: number }) {
  const reduce = useReducedMotion();
  const phase = offerPhase(offer, now);
  const fee = service.consultationFee;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: Math.min(index, 4) * 0.08 }}
      whileHover={reduce ? undefined : { y: -6 }}
      className="group relative w-[19rem] shrink-0 snap-start sm:w-[21rem]"
    >
      <div className="relative h-full rounded-[1.75rem] bg-gradient-to-br from-amber-300 via-brand-400 to-sky-soft-500 p-px shadow-lift transition-shadow duration-300 group-hover:shadow-glow">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.75rem-1px)] bg-surface p-5">
          {/* decorative glow + light sweep */}
          <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-400/15" />
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <span className="absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/40 to-transparent motion-reduce:hidden dark:via-white/10" />
          </span>

          <div className="relative flex items-center justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/25">
              <ServiceIcon name={service.icon} className="size-5" />
            </span>
            {phase === 'active' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                Live now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25">
                <Sparkles className="size-3" aria-hidden />
                Coming soon
              </span>
            )}
          </div>

          <div className="relative mt-4 flex items-end gap-2">
            <span className="font-display text-6xl leading-[0.85] font-semibold text-gradient-brand">{offer.percent}%</span>
            <span className="pb-0.5 text-sm leading-tight font-bold text-ink">
              OFF
              <span className="block text-xs font-medium text-muted">treatment fee</span>
            </span>
          </div>

          <h3 className="relative mt-3 text-lg leading-snug font-semibold text-ink">{service.name}</h3>
          <p className="relative mt-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            {offerRange(offer)} · {service.specialty.name}
          </p>

          {hasFee(fee) && (
            <p className="relative mt-3 flex items-baseline gap-2">
              <s className="text-sm text-muted decoration-red-400/80 decoration-2">{formatRupees(fee)}</s>
              <span className="text-2xl font-bold text-ink">{discountedFee(fee, offer.percent) === 0 ? 'Free' : formatRupees(discountedFee(fee, offer.percent))}</span>
            </p>
          )}

          <div className="relative mt-4">
            <Countdown offer={offer} now={now} />
          </div>

          <Link
            to={bookHref(service)}
            className="relative mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/25 transition-all hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            {phase === 'active' ? 'Book now' : `Book for ${shortDate(offer.startDate)} onwards`}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * Home page strip of treatment offers (running first, then upcoming by start date). Cards tick live; an offer that
 * starts flips to "Live now", and one that ends disappears without a page reload.
 */
export function TreatmentOffersSection() {
  const { data = [] } = useServices();
  const now = useNow(1000);
  const scroller = useRef<HTMLDivElement>(null);

  const offers = data
    .map((s) => ({ service: s, offer: liveOffer(s.offer, now) }))
    .filter((x): x is { service: DentalService; offer: ServiceOffer } => x.offer !== null)
    .sort((a, b) => {
      const pa = offerPhase(a.offer, now) === 'active' ? 0 : 1;
      const pb = offerPhase(b.offer, now) === 'active' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return pa === 0 ? Date.parse(a.offer.endsAt) - Date.parse(b.offer.endsAt) : Date.parse(a.offer.startsAt) - Date.parse(b.offer.startsAt);
    });
  if (offers.length === 0) return null;

  const anyActive = offers.some((o) => offerPhase(o.offer, now) === 'active');
  const best = Math.max(...offers.map((o) => o.offer.percent));
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-400/[0.04]" />
      <div className="container-page relative">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300">
              <Sparkles className="size-3.5" aria-hidden />
              Limited-time offers
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              {anyActive ? <>Save up to <span className="text-gradient-brand">{best}%</span> on treatments</> : 'Treatment offers coming soon'}
            </h2>
            <p className="mt-2 max-w-xl text-muted">For appointments within each offer&apos;s dates. Book online and see your price before you confirm.</p>
          </div>
          {offers.length > 1 && (
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous offers" className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-surface text-ink transition hover:border-brand-300 dark:border-white/10">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => scrollBy(1)} aria-label="More offers" className="flex size-11 items-center justify-center rounded-full border border-slate-200 bg-surface text-ink transition hover:border-brand-300 dark:border-white/10">
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          )}
        </Reveal>

        <div
          ref={scroller}
          className="relative -mx-4 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pt-2 pb-6 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {offers.map(({ service, offer }, i) => (
            <OfferCard key={service.id} service={service} offer={offer} now={now} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Small "30% off · till 15 Dec" tag for treatment lists (no price). */
export function TreatmentOfferTag({ offer, className }: { offer?: ServiceOffer | null; className?: string }) {
  const now = useNow(60_000);
  const live = liveOffer(offer, now);
  if (!live) return null;
  const active = offerPhase(live, now) === 'active';
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300', className)}>
      <Sparkles className="size-3" aria-hidden />
      {live.percent}% off · {active ? `till ${shortDate(live.endDate)}` : `from ${shortDate(live.startDate)}`}
    </span>
  );
}

/** Treatment fee, with the offer price while an offer is running. */
export function TreatmentFee({ service, className }: { service: Pick<DentalService, 'consultationFee' | 'offer'>; className?: string }) {
  const now = useNow(60_000);
  const fee = service.consultationFee;
  const live = liveOffer(service.offer, now);
  if (!hasFee(fee) || !live || offerPhase(live, now) !== 'active') {
    return <span className={cn('font-semibold text-ink', className)}>{formatFee(fee)}</span>;
  }
  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <s className="text-xs text-muted decoration-red-400/80">{formatRupees(fee)}</s>
      <span className="font-semibold text-ink">{formatRupees(discountedFee(fee, live.percent))}</span>
    </span>
  );
}
