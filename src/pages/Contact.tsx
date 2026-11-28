import type { ReactNode } from 'react';
import { ArrowUpRight, CalendarPlus, Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { useClinic, usePage } from '../hooks/usePublicData';
import { Seo } from '../components/content/Seo';
import { CustomSections } from '../components/content/Cms';
import { PageHeader } from '../components/layout/PageHeader';
import { LinkButton } from '../components/ui/Button';
import { WhatsAppIcon } from '../components/layout/WhatsAppButton';
import { formatPhone, telHref, whatsappHref } from '../utils/format';
import { clinicHours, weekdayInZone, weeklySchedule } from '../utils/clinicHours';
import { WeeklyHours, clinicTiles } from '../components/hours/WeeklyHours';
import { directionsHref } from '../utils/maps';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';

/** `wide`: content goes below the icon row and uses the card's full width (for richer content like the hours). */
function InfoCard({ icon, title, children, wide }: { icon: ReactNode; title: string; children: ReactNode; wide?: boolean }) {
  const iconEl = (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-transform duration-300 group-hover:scale-110 dark:text-brand-300">{icon}</span>
  );
  const card = 'group rounded-3xl border border-slate-200 bg-surface p-6 shadow-soft transition-shadow duration-300 hover:shadow-lift dark:hover:shadow-glow';
  if (wide) {
    return (
      <StaggerItem className={card}>
        <div className="flex items-center gap-4">
          {iconEl}
          <h2 className="font-semibold text-ink">{title}</h2>
        </div>
        <div className="mt-5 text-sm leading-relaxed text-muted">{children}</div>
      </StaggerItem>
    );
  }
  return (
    <StaggerItem className={`${card} flex gap-4`}>
      {iconEl}
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-ink">{title}</h2>
        <div className="mt-1 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </StaggerItem>
  );
}

export default function Contact() {
  const { clinic } = useClinic();
  const { section, sections, seo } = usePage('CONTACT');
  const intro = section('intro');
  const schedule = weeklySchedule(clinic);
  const directions = directionsHref(clinic);

  return (
    <>
      <Seo seo={seo} title="Contact" />
      <PageHeader eyebrow={intro?.subtitle ?? 'Contact'} title={intro?.title ?? 'Get in touch'} description={intro?.body}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href={telHref(clinic.phone)} size="lg" icon={<Phone className="size-5" aria-hidden />}>
            Call {formatPhone(clinic.phone)}
          </LinkButton>
          {clinic.whatsappNumber && (
            <LinkButton
              href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.clinicName}, I have a question.`)}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              variant="outline"
              icon={<WhatsAppIcon className="size-5 text-[#25D366]" />}
            >
              Chat on WhatsApp
            </LinkButton>
          )}
        </div>
      </PageHeader>

      <section className="container-page grid grid-cols-1 gap-8 py-14 sm:py-20 lg:grid-cols-5">
        <Stagger className="space-y-4 lg:col-span-2">
          <InfoCard icon={<MapPin className="size-5" aria-hidden />} title="Clinic address">
            <p>{clinic.address}</p>
            <a href={directions} target="_blank" rel="noopener noreferrer" className="group mt-2 inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Get directions
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </a>
          </InfoCard>
          <InfoCard icon={<Phone className="size-5" aria-hidden />} title="Phone">
            <a href={telHref(clinic.phone)} className="font-medium text-ink hover:text-brand-700">
              {formatPhone(clinic.phone)}
            </a>
          </InfoCard>
          {clinic.email && (
            <InfoCard icon={<Mail className="size-5" aria-hidden />} title="Email">
              <a href={`mailto:${clinic.email}`} className="font-medium break-all text-ink hover:text-brand-700">
                {clinic.email}
              </a>
            </InfoCard>
          )}
          <InfoCard wide icon={<Clock className="size-5" aria-hidden />} title="Working hours">
            <WeeklyHours
              compact
              today={weekdayInZone(clinic.timezone)}
              days={schedule.map((d) => ({ day: d.day, tiles: d.open ? clinicTiles(clinicHours(clinic)) : null }))}
            />
          </InfoCard>
        </Stagger>

        <Reveal from="right" delay={0.15} className="lg:col-span-3">
          <div className="h-full min-h-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {clinic.mapEmbedUrl ? (
              <iframe
                title={`Map showing ${clinic.clinicName}`}
                src={clinic.mapEmbedUrl}
                className="h-full min-h-[22rem] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full min-h-[22rem] flex-col items-center justify-center gap-3 p-8 text-center">
                <MapPin className="size-10 text-brand-400" aria-hidden />
                <p className="font-semibold text-ink">Google Maps embed placeholder</p>
                <p className="max-w-sm text-sm text-muted">
                  Add the clinic&apos;s Google Maps embed URL in Admin &rarr; Settings to show an interactive map here.
                </p>
                <LinkButton href={directions} target="_blank" rel="noopener noreferrer" variant="outline" size="sm" icon={<Navigation className="size-4" aria-hidden />}>
                  Get directions
                </LinkButton>
              </div>
            )}
          </div>
        </Reveal>
      </section>

      <Reveal as="section" className="container-page pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand-50 p-8 dark:ring-1 dark:ring-brand-400/15 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Prefer to book online?</h2>
            <p className="mt-1 text-muted">Choose a convenient date and time, and we will confirm with you.</p>
          </div>
          <LinkButton to="/book" size="lg" icon={<CalendarPlus className="size-5" aria-hidden />}>
            Book an appointment
          </LinkButton>
        </div>
      </Reveal>
      <CustomSections sections={sections} />
    </>
  );
}
