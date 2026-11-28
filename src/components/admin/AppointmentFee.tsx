import { BadgePercent, Globe, Sparkles, UserCog } from 'lucide-react';
import type { Appointment } from '../../types';
import { formatRupees } from '../../utils/format';
import { feeParts, type FeePart } from '../../utils/offers';
import { cn } from '../../utils/cn';

type FeeFields = Pick<
  Appointment,
  'status' | 'consultationFee' | 'firstVisitDiscountPercent' | 'treatmentFee' | 'treatmentDiscountPercent' | 'finalFee' | 'onlineBooking'
>;

const TAG = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1';
const TAG_ON = 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25';
const TAG_OFF = 'bg-slate-100 text-slate-500 ring-slate-200 line-through';

/** "-50% first visit" / "-30% treatment offer" tags. On a cancelled appointment they are shown struck through. */
export function DiscountBadges({ appt, className }: { appt: FeeFields; className?: string }) {
  const released = appt.status === 'CANCELLED';
  if (!appt.firstVisitDiscountPercent && !appt.treatmentDiscountPercent) return null;
  return (
    <span className={cn('flex flex-wrap gap-1', className)}>
      {appt.firstVisitDiscountPercent ? (
        <span title={released ? 'Released when this appointment was cancelled' : 'Online first-visit discount on the consultation fee'} className={cn(TAG, released ? TAG_OFF : TAG_ON)}>
          <Sparkles className="size-3" aria-hidden />-{appt.firstVisitDiscountPercent}% first visit
        </span>
      ) : null}
      {appt.treatmentDiscountPercent ? (
        <span title="Treatment offer covering this appointment's date" className={cn(TAG, released ? TAG_OFF : TAG_ON)}>
          <BadgePercent className="size-3" aria-hidden />-{appt.treatmentDiscountPercent}% treatment
        </span>
      ) : null}
    </span>
  );
}

/** Kept for existing imports. */
export const FirstVisitBadge = DiscountBadges;

/** Compact fee cell for the appointments table: total payable plus discount tags. */
export function FeeCell({ appt }: { appt: FeeFields }) {
  const released = appt.status === 'CANCELLED';
  const { total, discounted } = feeParts(appt, { ignoreDiscounts: released });
  const plain = feeParts(appt, { ignoreDiscounts: true }).total;
  return (
    <div className="space-y-1 whitespace-nowrap">
      {total == null ? (
        <p className="text-xs text-slate-400">At consultation</p>
      ) : discounted ? (
        <p className="text-sm">
          <s className="mr-1.5 text-xs text-slate-400">{formatRupees(plain ?? total)}</s>
          <span className="font-semibold text-ink">{formatRupees(total)}</span>
        </p>
      ) : (
        <p className="text-sm text-slate-700">{formatRupees(total)}</p>
      )}
      <DiscountBadges appt={appt} />
    </div>
  );
}

function PartRows({ label, part, discountLabel, released }: { label: string; part: FeePart; discountLabel: string; released: boolean }) {
  const active = !!part.percent && !released;
  return (
    <>
      <div className="flex justify-between gap-3">
        <dt className="text-slate-500">{label}</dt>
        <dd className={cn('text-ink', active && part.fee != null && 'text-slate-400 line-through')}>
          {part.fee == null ? 'Discussed at consultation' : formatRupees(part.fee)}
        </dd>
      </div>
      {part.percent ? (
        <div className="flex justify-between gap-3">
          <dt className="inline-flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
            <BadgePercent className="size-4" aria-hidden />
            {discountLabel} ({part.percent}%)
          </dt>
          <dd className="font-medium text-amber-800 dark:text-amber-300">
            {released ? 'Released (cancelled)' : part.fee != null && part.final != null ? `-${formatRupees(part.fee - part.final)}` : `${part.percent}% off`}
          </dd>
        </div>
      ) : null}
    </>
  );
}

/** Fee section in the appointment details modal. */
export function FeeSummary({ appt }: { appt: FeeFields }) {
  const released = appt.status === 'CANCELLED';
  const { consultation, treatment, total } = feeParts(appt, { ignoreDiscounts: released });
  const saved = feeParts(appt);
  const highlight = saved.discounted && !released;
  return (
    <section className={cn('rounded-2xl border p-4', highlight ? 'border-amber-200 bg-amber-50/50 dark:border-amber-400/25 dark:bg-amber-400/5' : 'border-slate-200')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Fee</h3>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          {appt.onlineBooking ? <Globe className="size-3.5" aria-hidden /> : <UserCog className="size-3.5" aria-hidden />}
          {appt.onlineBooking ? 'Booked online by the patient' : 'Added by the clinic'}
        </span>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <PartRows label="Consultation fee" part={{ ...saved.consultation, final: consultation.final }} discountLabel="First-visit online discount" released={released} />
        <PartRows label="Treatment fee" part={{ ...saved.treatment, final: treatment.final }} discountLabel="Treatment offer" released={released} />
        {total != null && (
          <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 dark:border-white/10">
            <dt className="font-semibold text-ink">Patient pays</dt>
            <dd className="font-semibold text-ink">{formatRupees(total)}</dd>
          </div>
        )}
      </dl>
      {highlight && (
        <ul className="mt-2 space-y-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
          {saved.consultation.percent ? <li>First visit: apply {saved.consultation.percent}% off the consultation fee.</li> : null}
          {saved.treatment.percent ? <li>Treatment offer: apply {saved.treatment.percent}% off the treatment fee.</li> : null}
        </ul>
      )}
    </section>
  );
}
