import { CalendarPlus } from 'lucide-react';
import { LinkButton } from '../ui/Button';
import { WhatsAppIcon } from './WhatsAppButton';
import { RichText } from '../content/Cms';
import { useSite, usePage } from '../../hooks/usePublicData';
import { whatsappHref } from '../../utils/format';
import type { Section } from '../../types';
import { OfferPill } from '../offer/FirstVisitOffer';

/** Call-to-action banner. Text and buttons come from the HOME "cta" section (Admin -> Homepage editor). */
export function CtaBand({ section: given }: { section?: Section }) {
  const { clinic } = useSite();
  const home = usePage('HOME');
  const section = given ?? home.section('cta');
  if (!section) return null;
  const primaryUrl = section.primaryButtonUrl || '/book';
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f766e] via-[#115a54] to-[#12405c] px-6 py-12 text-center sm:px-12 sm:py-16 dark:from-[#0b3b37] dark:via-[#082a2c] dark:to-[#0c2440] dark:ring-1 dark:ring-brand-400/20">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-16 size-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-24 size-72 rounded-full bg-sky-soft-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <OfferPill className="mb-5" />
          {section.title && <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">{section.title}</h2>}
          {section.body && <RichText text={section.body} className="mt-4 text-mint" />}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton {...(primaryUrl.startsWith('/') ? { to: primaryUrl } : { href: primaryUrl })} variant="white" size="lg" icon={<CalendarPlus className="size-5" aria-hidden />}>
              {section.primaryButtonLabel || clinic.headerCtaText || 'Book an appointment'}
            </LinkButton>
            {clinic.whatsappNumber && (
              <LinkButton href={whatsappHref(clinic.whatsappNumber)} target="_blank" rel="noopener noreferrer" size="lg" variant="glass" icon={<WhatsAppIcon className="size-5" />}>
                WhatsApp us
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
