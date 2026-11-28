import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, BadgePercent, Check, Sparkles, X } from 'lucide-react';
import { discountedFee, hasFee, useFirstVisitOffer } from '../../hooks/useFirstVisitOffer';
import { EASE_OUT } from '../motion/Reveal';
import { formatRupees } from '../../utils/format';
import { cn } from '../../utils/cn';
import { feeParts, offerCoversDate, offerRange, type FeeSnapshot } from '../../utils/offers';
import type { ServiceOffer } from '../../types';

/** "~~₹500~~ ₹250" */
function PriceTag({ fee, percent, className, strikeClassName }: { fee: number; percent: number; className?: string; strikeClassName?: string }) {
  const price = discountedFee(fee, percent);
  return (
    <span className={cn('inline-flex items-baseline gap-1.5 whitespace-nowrap', className)}>
      <s className={cn('text-[0.85em] font-medium text-muted decoration-red-400/80 decoration-2', strikeClassName)}>{formatRupees(fee)}</s>
      <span className="font-bold">{price === 0 ? 'Free' : formatRupees(price)}</span>
    </span>
  );
}

/** Moving light sweep used on the offer surfaces. */
function Shine({ className }: { className?: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className={cn('absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/50 to-transparent motion-reduce:hidden dark:via-white/15', className)} />
    </span>
  );
}

/**
 * Floating card on the home hero image. It drifts with the page scroll (parallax + slight tilt) and links to booking.
 */
export function HeroOfferCard() {
  const offer = useFirstVisitOffer();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -70]);
  const rotate = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -4]);
  if (!offer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 28, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 1.1, duration: 0.7, ease: EASE_OUT }}
      style={{ y, rotate }}
      className="absolute top-[38%] -right-2 z-10 hidden sm:-right-8 sm:block"
    >
      <motion.div animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
        <Link
          to="/book"
          aria-label={`${offer.percent}% off your first consultation when you book online. Book now`}
          className="group relative block rounded-3xl bg-gradient-to-br from-amber-300 via-brand-400 to-sky-soft-500 p-px shadow-lift transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow"
        >
          <span className="relative block w-52 overflow-hidden rounded-[23px] bg-surface/95 p-4 backdrop-blur-md sm:w-56">
            <Shine />
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-amber-700 uppercase dark:text-amber-300">
              <Sparkles className="size-3.5" aria-hidden />
              {offer.pendingFirst ? 'Applied to your visit' : 'Online booking offer'}
            </span>
            <span className="mt-1.5 flex items-end gap-1.5">
              <span className="font-display text-5xl leading-none font-semibold text-gradient-brand">{offer.percent}%</span>
              <span className="pb-1 text-sm leading-tight font-bold text-ink">
                OFF
                <span className="block text-xs font-medium text-muted">consultation</span>
              </span>
            </span>
            <span className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-3 dark:border-white/10">
              <span className="text-xs leading-snug text-muted">
                {offer.pendingFirst ? 'Reserved for your upcoming visit' : 'On your first visit, booked online'}
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white transition-transform duration-300 group-hover:translate-x-0.5 dark:bg-brand-500">
                {offer.pendingFirst ? <Check className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
              </span>
            </span>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}

/** Endless scrolling ribbon under the home hero. Pauses on hover and stops for reduced-motion users. */
export function OfferTicker() {
  const offer = useFirstVisitOffer();
  if (!offer) return null;
  const items = [
    `Book your first visit online & get ${offer.percent}% off consultation`,
    offer.pendingFirst ? 'Your online discount is reserved for your upcoming visit' : 'Online bookings only, applied to your first appointment',
    'See your discounted fee before you book',
    'Book online in a minute',
  ];
  const row = [...items, ...items];

  return (
    <Link
      to="/book"
      aria-label={items[0]}
      className="group relative block overflow-hidden border-y border-brand-800/30 bg-gradient-to-r from-[#0f766e] via-[#115a54] to-[#12405c] py-3 text-white dark:border-brand-400/15 dark:from-[#0b3b37] dark:via-[#082a2c] dark:to-[#0c2440]"
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0f766e] to-transparent dark:from-[#0b3b37]" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#12405c] to-transparent dark:from-[#0c2440]" />
      <span aria-hidden className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[0, 1].map((half) => (
          <span key={half} className="flex shrink-0 items-center">
            {row.map((text, i) => (
              <span key={i} className="flex items-center gap-3 px-6 text-sm font-semibold whitespace-nowrap">
                <BadgePercent className="size-4 text-amber-300" />
                {text}
                <span className="ml-6 size-1.5 rounded-full bg-white/30" />
              </span>
            ))}
          </span>
        ))}
      </span>
    </Link>
  );
}

/** Tiny "-50%" tag pinned to a Book button. Wrap the button in a `relative` element. */
export function OfferBadge({ className }: { className?: string }) {
  const offer = useFirstVisitOffer();
  if (!offer || offer.pendingFirst) return null;
  return (
    <motion.span
      aria-hidden
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.6 }}
      className={cn(
        'pointer-events-none absolute -top-2 -right-2 z-10 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] leading-none font-extrabold text-amber-950 shadow-md ring-2 ring-surface',
        className,
      )}
    >
      -{offer.percent}%
    </motion.span>
  );
}

/** One-line pill for dark banners (CTA band). */
export function OfferPill({ className }: { className?: string }) {
  const offer = useFirstVisitOffer();
  if (!offer) return null;
  return (
    <p className={cn('relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 sm:text-sm', className)}>
      <Shine className="via-white/25" />
      <Sparkles className="size-4 text-amber-300" aria-hidden />
      Book your first visit online: {offer.percent}% off consultation
    </p>
  );
}

/** Card in the booking page sidebar explaining the discount. */
export function BookingOfferNote() {
  const offer = useFirstVisitOffer();
  if (!offer) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.5 }}
      className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-300 via-brand-400 to-sky-soft-500 p-px shadow-soft"
    >
      <div className="relative flex items-center gap-4 rounded-[15px] bg-surface p-4">
        <Shine />
        <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25">
          <span className="text-base leading-none font-extrabold">{offer.percent}%</span>
          <span className="text-[9px] font-bold tracking-wider">OFF</span>
        </span>
        <div className="text-sm">
          <p className="font-semibold text-ink">
            {offer.pendingFirst ? 'Your online booking discount is reserved' : `${offer.percent}% off for booking online`}
          </p>
          <p className="mt-0.5 text-muted">
            {offer.pendingFirst
              ? 'It applies to your pending first appointment.'
              : 'On your first visit. Pick a doctor to see your fee after the discount.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/** Doctor / treatment fee with the first-visit price next to it, for choice cards. */
export function FeeWithOffer({ fee }: { fee?: number | null }) {
  const offer = useFirstVisitOffer();
  if (fee == null) return <span>Fee discussed at consultation</span>;
  if (!offer || offer.pendingFirst || !hasFee(fee)) return <span>{formatRupees(fee)}</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <PriceTag fee={fee} percent={offer.percent} className="text-ink" />
      <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">first visit</span>
    </span>
  );
}

interface BreakdownService {
  name: string;
  consultationFee?: number | null;
  offer?: ServiceOffer | null;
}

function Line({ label, amount, struck, after, accent, sub }: { label: ReactNode; amount: ReactNode; struck?: boolean; after?: ReactNode; accent?: boolean; sub?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className={cn('min-w-0', accent ? 'inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300' : 'text-muted')}>
        <span>{label}{sub && <span className="block text-xs font-normal text-muted">{sub}</span>}</span>
      </dt>
      <dd className={cn('shrink-0 font-medium', accent ? 'text-amber-700 dark:text-amber-300' : 'text-ink')}>
        {struck ? (
          <span className="inline-flex items-baseline gap-2">
            <s className="text-xs text-muted decoration-red-400/80 decoration-2">{amount}</s>
            <span className="font-semibold text-ink">{after}</span>
          </span>
        ) : (
          amount
        )}
      </dd>
    </div>
  );
}

/**
 * Fee summary above the submit button: the doctor's consultation fee (with the online first-visit discount) and the
 * treatment fee (with a treatment offer covering the chosen date), then the estimated total.
 */
export function FeeBreakdown({ doctorName, doctorFee, service, date }: { doctorName: string; doctorFee?: number | null; service?: BreakdownService; date?: string }) {
  const offer = useFirstVisitOffer();
  const firstVisit = !!offer && !offer.pendingFirst && hasFee(doctorFee) ? offer.percent : null;
  const consultFinal = hasFee(doctorFee) ? (firstVisit ? discountedFee(doctorFee, firstVisit) : doctorFee) : null;

  const tFee = service?.consultationFee;
  const tOffer = service?.offer && service.offer.status !== 'ENDED' ? service.offer : null;
  const tPercent = hasFee(tFee) && offerCoversDate(tOffer, date) ? tOffer!.percent : null;
  const treatFinal = hasFee(tFee) ? (tPercent ? discountedFee(tFee, tPercent) : tFee) : null;
  const total = consultFinal == null && treatFinal == null ? null : (consultFinal ?? 0) + (treatFinal ?? 0);
  const anyDiscount = !!firstVisit || !!tPercent;
  const rupees = (n: number) => (n === 0 ? 'Free' : formatRupees(n));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={cn('relative overflow-hidden rounded-2xl p-px', anyDiscount ? 'bg-gradient-to-br from-amber-300 via-brand-400 to-sky-soft-500' : 'bg-slate-200 dark:bg-white/10')}
    >
      <div className="relative rounded-[15px] bg-surface p-4 sm:p-5">
        {anyDiscount && <Shine />}
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Fee summary</p>
        <dl className="mt-3 space-y-2 text-sm">
          <Line
            label={`Consultation · ${doctorName}`}
            amount={doctorFee == null ? 'At consultation' : formatRupees(doctorFee)}
            struck={!!firstVisit && consultFinal != null}
            after={consultFinal != null ? rupees(consultFinal) : null}
          />
          {firstVisit && hasFee(doctorFee) && (
            <Line label={<><Sparkles className="mr-1 inline size-4" aria-hidden />First visit online offer ({firstVisit}% off)</>} amount={`-${formatRupees(doctorFee - consultFinal!)}`} accent />
          )}

          {service && (
            <>
              <Line
                label={`Treatment · ${service.name}`}
                amount={tFee == null ? 'At consultation' : formatRupees(tFee)}
                struck={!!tPercent && treatFinal != null}
                after={treatFinal != null ? rupees(treatFinal) : null}
              />
              {tPercent && hasFee(tFee) && (
                <Line
                  label={<><Sparkles className="mr-1 inline size-4" aria-hidden />Treatment offer ({tPercent}% off)</>}
                  sub={`For appointments ${offerRange(tOffer!)}`}
                  amount={`-${formatRupees(tFee - treatFinal!)}`}
                  accent
                />
              )}
            </>
          )}

          {total != null && (
            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 dark:border-white/10">
              <dt className="font-semibold text-ink">Estimated total at the clinic</dt>
              <dd className="font-display text-2xl font-semibold text-ink">{rupees(total)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-3 space-y-1 text-xs text-muted">
          {offer && !offer.pendingFirst && !hasFee(doctorFee) && (
            <p>The {offer.percent}% online first-visit discount applies only to doctors with a listed consultation fee.</p>
          )}
          {offer?.pendingFirst && <p>Your first-visit discount is already reserved for your pending appointment.</p>}
          {tOffer && hasFee(tFee) && !tPercent && (
            <p className="font-medium text-amber-700 dark:text-amber-300">
              {tOffer.percent}% off {service!.name} for appointments {offerRange(tOffer)}.{' '}
              {date ? 'Pick a date in that range to get it.' : 'Pick a date in that range.'}
            </p>
          )}
          {service && tFee == null && doctorFee == null && <p>Fees are discussed at the consultation.</p>}
        </div>
      </div>
    </motion.div>
  );
}

/** Fee lines inside the booking confirmation, from what the server saved on the appointment. */
export function BookingSuccessOffer({ snapshot }: { snapshot: FeeSnapshot }) {
  const { consultation, treatment, total } = feeParts(snapshot);
  if (total == null) return null;
  return (
    <div className="mx-auto mt-5 max-w-md space-y-2 text-sm">
      {consultation.percent && (
        <p className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-amber-50 px-4 py-2 font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25">
          <Sparkles className="size-4" aria-hidden />
          Booked online: {consultation.percent}% off your first consultation
        </p>
      )}
      {treatment.percent && (
        <p className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-amber-50 px-4 py-2 font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25">
          <BadgePercent className="size-4" aria-hidden />
          Treatment offer: {treatment.percent}% off
        </p>
      )}
      <p className="text-muted">
        Estimated total at the clinic: <strong className="text-ink">{total === 0 ? 'Free' : formatRupees(total)}</strong>
      </p>
    </div>
  );
}

const DISMISS_KEY = 'firstVisitOfferDismissed';
const HIDE_ON = ['/book', '/profile'];

/**
 * Small pill that slides in at the bottom-left once the visitor has scrolled a little (every page except booking).
 * Dismissing it hides it for the rest of the browser session.
 */
export function FloatingOfferPill() {
  const offer = useFirstVisitOffer();
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 700));
  useEffect(() => setScrolled(window.scrollY > 700), [pathname]);

  const show = !!offer && !offer.pendingFirst && scrolled && !dismissed && !HIDE_ON.some((p) => pathname.startsWith(p));
  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {show && offer && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="fixed bottom-4 left-4 z-30 max-w-[calc(100vw-6.5rem)]"
        >
          <div className="relative rounded-full bg-gradient-to-r from-amber-300 via-brand-400 to-sky-soft-500 p-px shadow-lift">
            <div className="relative flex items-center gap-1 rounded-full bg-surface/95 py-1.5 pr-1.5 pl-1.5 backdrop-blur-md">
              <Shine />
              <Link to="/book" className="flex min-w-0 items-center gap-2.5 pr-1">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-extrabold text-amber-950">
                  -{offer.percent}%
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold text-ink">Book online, save {offer.percent}%</span>
                  <span className="block truncate text-xs text-muted">On your first consultation</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Hide offer"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink dark:hover:bg-white/10"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
