import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Flame, Sparkles, Timer } from 'lucide-react';
import type { DentalService, ServiceOffer } from '../../types';
import { useServices } from '../../hooks/usePublicData';
import { useNow } from '../../hooks/useNow';
import { discountedFee, hasFee } from '../../hooks/useFirstVisitOffer';
import { ServiceIcon } from '../services/ServiceIcon';
import { EASE_OUT, Reveal } from '../motion/Reveal';
import { formatFee, formatRupees } from '../../utils/format';
import { countdownParts, liveOffer, offerPhase, offerRange, shortDate, type OfferPhase } from '../../utils/offers';
import { cn } from '../../utils/cn';

const DAY_MS = 86_400_000;

export function bookHref(s: DentalService): string {
  const doctor = s.doctors.length === 1 ? `&doctor=${s.doctors[0].slug}` : '';
  return `/book?specialty=${s.specialty.slug}&service=${s.slug}${doctor}`;
}

function Unit({ value, label, urgent }: { value: number; label: string; urgent?: boolean }) {
  return (
    <span
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center rounded-xl py-2 ring-1',
        urgent
          ? 'bg-red-50 ring-red-200/70 dark:bg-red-500/10 dark:ring-red-400/20'
          : 'bg-gradient-to-b from-slate-50 to-slate-100/60 ring-slate-900/5 dark:from-white/[0.07] dark:to-white/[0.03] dark:ring-white/10',
      )}
    >
      <span className={cn('font-display text-xl leading-none font-semibold tabular-nums', urgent ? 'text-red-600 dark:text-red-400' : 'text-ink')}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[9px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</span>
    </span>
  );
}

/** Live countdown to the offer's start (scheduled) or end (running). Owns its 1s timer so only it re-renders. */
function Countdown({ offer }: { offer: ServiceOffer }) {
  const now = useNow(1000);
  const phase = offerPhase(offer, now);
  const target = phase === 'scheduled' ? offer.startsAt : offer.endsAt;
  const p = countdownParts(target, now);
  const urgent = phase === 'active' && Date.parse(offer.endsAt) - now < DAY_MS;
  return (
    <div>
      <p className={cn('mb-2 flex items-center gap-1.5 text-xs font-semibold', urgent ? 'text-red-600 dark:text-red-400' : 'text-muted')}>
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

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT, delay: Math.min(i, 4) * 0.08 } }),
};

interface OfferCardProps {
  service: DentalService;
  offer: ServiceOffer;
  phase: OfferPhase;
  index: number;
}

/** Memoised: re-renders only when the offer or its phase changes (the countdown ticks on its own). */
const OfferCard = memo(function OfferCard({ service, offer, phase, index }: OfferCardProps) {
  const fee = service.consultationFee;
  const active = phase === 'active';
  const price = hasFee(fee) ? discountedFee(fee, offer.percent) : null;
  const saving = hasFee(fee) && price != null ? fee - price : 0;

  return (
    <motion.article variants={cardVariants} custom={index} data-offer-card className="group relative w-[84%] max-w-[21rem] shrink-0 snap-start sm:w-[21rem]">
      <div
        className={cn(
          'relative h-full rounded-[1.75rem] p-px shadow-lift transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-glow',
          active
            ? 'bg-gradient-to-br from-amber-300 via-brand-400 to-sky-soft-500'
            : 'bg-gradient-to-br from-slate-200 via-amber-200 to-slate-200 dark:from-white/10 dark:via-amber-300/40 dark:to-white/10',
        )}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.75rem-1px)] bg-surface">
          {/* Decorative: tinted header wash, warm glow and a light sweep (transform-only, GPU-cheap). */}
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-50/90 to-transparent dark:from-brand-400/[0.08]" />
          <span aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-48 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-400/15" />
          {active && (
            <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <span className="absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/40 to-transparent will-change-transform motion-reduce:hidden dark:via-white/[0.07]" />
            </span>
          )}

          <div className="relative p-5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface text-brand-700 shadow-soft ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/25">
                <ServiceIcon name={service.icon} className="size-5" />
              </span>
              {active ? (
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

            <div className="mt-5 flex items-end gap-2.5">
              <span className="font-display text-[4rem] leading-[0.8] font-semibold tracking-tight text-gradient-brand">
                {offer.percent}
                <span className="text-[2.75rem]">%</span>
              </span>
              <span className="pb-1 text-sm leading-tight font-extrabold tracking-wide text-ink">
                OFF
                <span className="block text-xs font-medium tracking-normal text-muted">treatment fee</span>
              </span>
            </div>

            <h3 className="mt-4 line-clamp-2 text-lg leading-snug font-semibold text-ink">{service.name}</h3>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                {offerRange(offer)} · {service.specialty.name}
              </span>
            </p>

            {hasFee(fee) && price != null && (
              <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className="text-[1.75rem] leading-none font-bold text-ink">{price === 0 ? 'Free' : formatRupees(price)}</span>
                <s className="text-sm text-muted decoration-red-400/80 decoration-2">{formatRupees(fee)}</s>
                {saving > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                    Save {formatRupees(saving)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Coupon-style perforation */}
          <div aria-hidden className="relative mx-5 border-t-2 border-dashed border-slate-200/80 dark:border-white/10" />

          <div className="relative mt-auto space-y-4 p-5 pt-4">
            <Countdown offer={offer} />
            <Link
              to={bookHref(service)}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand-700/25 transition-all hover:brightness-110 active:scale-[0.98] dark:from-brand-500 dark:to-brand-400"
            >
              {active ? 'Book now' : `Book for ${shortDate(offer.startDate)} onwards`}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

/**
 * Home page strip of treatment offers (running first, then upcoming by start date). Cards tick live; an offer that
 * starts flips to "Live now", and one that ends disappears without a page reload.
 */
export function TreatmentOffersSection() {
  const { data = [] } = useServices();
  const now = useNow(1000);
  const scroller = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  const offers = data
    .map((s) => ({ service: s, offer: liveOffer(s.offer, now) }))
    .filter((x): x is { service: DentalService; offer: ServiceOffer } => x.offer !== null)
    .map((x) => ({ ...x, phase: offerPhase(x.offer, now) }))
    .sort((a, b) => {
      const pa = a.phase === 'active' ? 0 : 1;
      const pb = b.phase === 'active' ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return pa === 0 ? Date.parse(a.offer.endsAt) - Date.parse(b.offer.endsAt) : Date.parse(a.offer.startsAt) - Date.parse(b.offer.startsAt);
    });
  const count = offers.length;

  // Track which card is in view (dots) and whether we're at either end (arrows). rAF-throttled, passive listener.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const cards = el.querySelectorAll<HTMLElement>('[data-offer-card]');
      if (!cards.length) return;
      const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 4;
      setActiveIndex(atEnd ? cards.length - 1 : Math.round(el.scrollLeft / step));
      setEdges({ start: el.scrollLeft <= 4, end: atEnd });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [count]);

  if (count === 0) return null;

  const anyActive = offers.some((o) => o.phase === 'active');
  const best = Math.max(...offers.map((o) => o.offer.percent));

  const scrollToCard = (i: number) => {
    const el = scroller.current;
    const card = el?.querySelectorAll<HTMLElement>('[data-offer-card]')[i];
    if (!el || !card) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    el.scrollTo({ left: card.offsetLeft - pad, behavior: 'smooth' });
  };
  const scrollBy = (dir: number) => scrollToCard(Math.max(0, Math.min(count - 1, activeIndex + dir)));

  const arrowCls =
    'flex size-11 items-center justify-center rounded-full border border-slate-200 bg-surface text-ink shadow-soft transition hover:border-brand-300 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40 dark:border-white/10 dark:hover:text-brand-300';

  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-400/[0.04]" />
      <div className="container-page relative">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-100/70 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-amber-800 uppercase ring-1 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
              <Sparkles className="size-3.5" aria-hidden />
              Limited-time offers
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
              {anyActive ? (
                <>
                  Save up to <span className="text-gradient-brand">{best}%</span> on treatments
                </>
              ) : (
                'Treatment offers coming soon'
              )}
            </h2>
            <p className="mt-2 max-w-xl text-muted">For appointments within each offer&apos;s dates. Book online and see your price before you confirm.</p>
          </div>
          {count > 1 && (
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => scrollBy(-1)} disabled={edges.start} aria-label="Previous offers" className={arrowCls}>
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" onClick={() => scrollBy(1)} disabled={edges.end} aria-label="More offers" className={arrowCls}>
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          )}
        </Reveal>

        <motion.div
          ref={scroller}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className={cn(
            'relative -mx-4 mt-8 flex gap-4 overflow-x-auto overscroll-x-contain px-4 pt-2 pb-6 sm:-mx-6 sm:gap-5 sm:px-6',
            // Native momentum scrolling with snapping; snap points honour the side padding so cards line up with the text.
            'snap-x snap-mandatory scroll-px-4 sm:scroll-px-6',
            '[scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {offers.map(({ service, offer, phase }, i) => (
            <OfferCard key={service.id} service={service} offer={offer} phase={phase} index={i} />
          ))}
        </motion.div>

        {count > 1 && (
          <div className="-mt-1 flex justify-center gap-1" aria-label="Choose an offer">
            {offers.map(({ service }, i) => (
              <button
                key={service.id}
                type="button"
                aria-current={i === activeIndex}
                aria-label={`Offer ${i + 1}: ${service.name}`}
                onClick={() => scrollToCard(i)}
                className="flex h-6 items-center px-0.5"
              >
                <span
                  className={cn(
                    'block h-1.5 rounded-full transition-all duration-300',
                    i === activeIndex ? 'w-6 bg-brand-600 dark:bg-brand-400' : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-white/20',
                  )}
                />
              </button>
            ))}
          </div>
        )}
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
