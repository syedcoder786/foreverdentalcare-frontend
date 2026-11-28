import type { ServiceOffer } from '../types';

export type OfferPhase = 'scheduled' | 'active' | 'ended';

/** Phase of an offer at `now` (epoch ms), from its exact start/end instants, so it flips live without a refetch. */
export function offerPhase(offer: ServiceOffer, now: number): OfferPhase {
  if (now < Date.parse(offer.startsAt)) return 'scheduled';
  if (now >= Date.parse(offer.endsAt)) return 'ended';
  return 'active';
}

/** True when the offer covers an appointment on `date` (YYYY-MM-DD, clinic-local). */
export function offerCoversDate(offer: ServiceOffer | null | undefined, date?: string): boolean {
  return !!offer && !!date && date >= offer.startDate && date <= offer.endDate;
}

/** Live (scheduled or running) offer, or null. */
export function liveOffer(offer: ServiceOffer | null | undefined, now: number): ServiceOffer | null {
  return offer && offerPhase(offer, now) !== 'ended' ? offer : null;
}

/** "3d 04h 12m 09s" style parts until `target`. */
export function countdownParts(target: string, now: number) {
  const ms = Math.max(0, Date.parse(target) - now);
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, done: ms === 0 };
}

/** "1 Dec" or "1 Dec 2027" (year only when not the current one). */
export function shortDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** "1 Dec – 15 Dec" (or a single day). */
export function offerRange(offer: Pick<ServiceOffer, 'startDate' | 'endDate'>): string {
  return offer.startDate === offer.endDate ? shortDate(offer.startDate) : `${shortDate(offer.startDate)} – ${shortDate(offer.endDate)}`;
}

/** Saved fee fields of an appointment / booking confirmation. */
export interface FeeSnapshot {
  consultationFee?: number | null;
  firstVisitDiscountPercent?: number | null;
  treatmentFee?: number | null;
  treatmentDiscountPercent?: number | null;
  finalFee?: number | null;
}

export interface FeePart {
  fee: number | null;
  percent: number | null;
  /** Fee after the discount (equals fee without one); null when there is no fee. */
  final: number | null;
}

/** Splits an appointment's saved fees into consultation / treatment parts (same rounding as the server). */
export function feeParts(a: FeeSnapshot, opts: { ignoreDiscounts?: boolean } = {}) {
  const part = (fee?: number | null, percent?: number | null): FeePart => {
    const p = opts.ignoreDiscounts ? null : percent ?? null;
    const f = fee ?? null;
    return { fee: f, percent: p, final: f == null ? null : p ? Math.round((f * (100 - p)) / 100) : f };
  };
  const consultation = part(a.consultationFee, a.firstVisitDiscountPercent);
  const treatment = part(a.treatmentFee, a.treatmentDiscountPercent);
  const total = consultation.final == null && treatment.final == null ? null : (consultation.final ?? 0) + (treatment.final ?? 0);
  return { consultation, treatment, total, discounted: !!consultation.percent || !!treatment.percent };
}
