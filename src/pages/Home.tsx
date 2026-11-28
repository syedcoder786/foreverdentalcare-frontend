import type { ReactNode } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'motion/react';
import { ArrowRight, ArrowUpRight, CalendarPlus, Check, Clock, MapPin, Phone, Quote, Sparkles, Star } from 'lucide-react';
import type { Section } from '../types';
import { useDoctors, useGallery, usePage, useServices, useSite, useSpecialties, useTestimonials } from '../hooks/usePublicData';
import { LinkButton } from '../components/ui/Button';
import { ImagePlaceholder } from '../components/ui/ImagePlaceholder';
import { ServiceCard } from '../components/services/ServiceCard';
import { DoctorAvatar, DoctorCard } from '../components/doctors/DoctorCard';
import { SpecialtyCard } from '../components/specialties/SpecialtyCard';
import { ErrorMessage } from '../components/ui/Alert';
import { PageLoader, Skeleton } from '../components/ui/Spinner';
import { CtaBand } from '../components/layout/CtaBand';
import { CmsButtons, CmsCards, CmsHeading, CustomSection, RichText, SmartLink } from '../components/content/Cms';
import { Seo } from '../components/content/Seo';
import { NextAppointmentCard } from '../components/patient/NextAppointmentCard';
import { HeroOfferCard, OfferBadge, OfferTicker } from '../components/offer/FirstVisitOffer';
import { TreatmentOffersSection } from '../components/offer/TreatmentOffers';
import { HeroSlides } from '../components/offer/HeroSlides';
import { EASE_OUT, Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { formatPhone, telHref } from '../utils/format';
import { directionsHref } from '../utils/maps';
import { getErrorMessage } from '../utils/errors';
import { todayStatus, weeklySchedule } from '../utils/clinicHours';
import { cn } from '../utils/cn';

const heroContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };
const heroItem: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } } };
const word: Variants = {
  hidden: { opacity: 0, y: '0.45em', filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE_OUT } },
};

function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 right-[-10%] size-[38rem] rounded-full bg-brand-100/80 blur-3xl dark:bg-brand-500/20"
        animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-12rem] left-[-12%] size-[30rem] rounded-full bg-sky-soft-100/80 blur-3xl dark:bg-sky-soft-500/15"
        animate={{ x: [0, 50, 0], y: [0, -24, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 opacity-0 [background-image:radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:22px_22px] dark:opacity-100" />
    </div>
  );
}

function HeroContact({ href, icon, label, newTab, children }: { href: string; icon: ReactNode; label: string; newTab?: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex items-center gap-3 whitespace-nowrap rounded-full py-1 pr-2"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/25 dark:group-hover:bg-brand-400/20">
        {icon}
      </span>
      <span className="leading-tight">
        <span className="block text-xs font-medium text-muted">{label}</span>
        <span className="block text-base font-semibold text-ink transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300">{children}</span>
      </span>
    </a>
  );
}

/** "Miston Ganj, Rampur" from a full comma-separated address (empty for the seeded placeholder). */
function shortArea(address?: string): string {
  if (!address || address.startsWith('[PLACEHOLDER]')) return '';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.length >= 3 ? parts.slice(-3, -1).join(', ') : parts[0] ?? '';
}

/** Highlighted "Get directions" card: gradient border, pulsing pin and an arrow button, so it invites a click. */
function DirectionsCard({ href, area }: { href: string; area: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-2xl bg-gradient-to-r from-brand-400/80 via-sky-soft-500/60 to-brand-400/80 p-px shadow-lg shadow-brand-700/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/30"
    >
      <span className="flex items-center gap-3.5 rounded-[15px] bg-surface/95 py-2 pr-2.5 pl-2 backdrop-blur-md">
        <span className="relative flex size-11 shrink-0 items-center justify-center">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-xl bg-brand-400/30 [animation-duration:2.4s]" />
          <span className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-md shadow-brand-700/30">
            <MapPin className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" aria-hidden />
          </span>
        </span>
        <span className="leading-tight whitespace-nowrap">
          <span className="block text-base font-semibold text-ink">Get directions</span>
          <span className="mt-0.5 block text-xs font-medium text-muted">{area ? `${area} · Google Maps` : 'Open in Google Maps'}</span>
        </span>
        <span className="ml-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-all duration-300 group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600 dark:text-brand-300 dark:ring-brand-400/25 dark:group-hover:bg-brand-500 dark:group-hover:text-white">
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </span>
      </span>
    </a>
  );
}

function Hero({ section }: { section: Section }) {
  const { clinic } = useSite();
  const { data: doctors = [] } = useDoctors();
  const featured = doctors.filter((d) => d.featured);
  const status = todayStatus(clinic);
  const words = (section.title ?? '').split(' ');
  const plain = words.length > 2 ? words.slice(0, -2) : [];
  const highlighted = words.length > 2 ? words.slice(-2).join(' ') : words.join(' ');
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 600], [0, 60]);

  return (
    <section className="relative -mt-18 overflow-hidden pt-18">
      <Aurora />
      <NextAppointmentCard />
      <div className="container-page relative grid grid-cols-1 items-center gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <motion.div className="min-w-0 lg:col-span-7" variants={heroContainer} initial="hidden" animate="show">
          <HeroSlides
            intro={
              <>
              {section.subtitle && (
                <motion.p variants={heroItem} className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-surface/80 px-3.5 py-1.5 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur dark:border-brand-400/20">
                  <span className="relative flex size-2">
                    {status.open && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                    <span className={cn('relative inline-flex size-2 rounded-full', status.open ? 'bg-emerald-500' : 'bg-slate-300')} />
                  </span>
                  {section.subtitle}
                </motion.p>
              )}
              <motion.h1
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                className="mt-6 font-display text-[2.6rem] leading-[1.08] font-semibold text-ink sm:text-6xl lg:text-[4.25rem]"
              >
                {plain.map((w, i) => (
                  <motion.span key={`${w}-${i}`} variants={word} className="inline-block whitespace-pre">
                    {w}{' '}
                  </motion.span>
                ))}
                <motion.span variants={word} className="relative inline-block whitespace-nowrap text-gradient-brand">
                  {highlighted}
                  <svg aria-hidden viewBox="0 0 220 12" className="absolute -bottom-2 left-0 h-3 w-full text-brand-200 dark:text-brand-400/60" preserveAspectRatio="none">
                    <motion.path d="M2 9c50-6 160-8 216-2" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.9, ease: EASE_OUT }} />
                  </svg>
                </motion.span>
              </motion.h1>
              {section.body && (
                <motion.div variants={heroItem} className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                  <RichText text={section.body} />
                </motion.div>
              )}
              <motion.div variants={heroItem} className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                <CmsButtons section={section} />
                {!section.primaryButtonLabel && (
                  <span className="relative inline-flex">
                  <OfferBadge />
                  <LinkButton
                    to="/book"
                    size="lg"
                    className="shadow-lg shadow-brand-700/25 hover:-translate-y-0.5 dark:shadow-brand-400/20"
                    icon={<CalendarPlus className="size-5" aria-hidden />}
                  >
                    {clinic.headerCtaText || 'Book an appointment'}
                  </LinkButton>
                  </span>
                )}
              </motion.div>
              </>
            }
          />
          <motion.div variants={heroItem} className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            {clinic.phone && (
              <HeroContact href={telHref(clinic.phone)} icon={<Phone className="size-[18px] transition-transform duration-200 group-hover:rotate-12" aria-hidden />} label="Call us">
                {formatPhone(clinic.phone)}
              </HeroContact>
            )}
            {(clinic.mapLinkUrl || clinic.address) && <DirectionsCard href={directionsHref(clinic)} area={shortArea(clinic.address)} />}
          </motion.div>
          {section.items.length > 0 && (
            <motion.ul variants={heroItem} className="mt-8 flex flex-wrap gap-2.5 text-sm font-medium text-slate-600">
              {section.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200/80 bg-surface/60 py-1.5 pr-3.5 pl-1.5 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {item.title}
                </li>
              ))}
            </motion.ul>
          )}
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none"
          initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.2 }}
        >
          <div aria-hidden className="absolute -inset-3 rounded-[2.9rem] bg-gradient-to-br from-brand-200/60 via-transparent to-sky-soft-200/60 blur-xl dark:from-brand-400/30 dark:to-sky-soft-500/25" />
          <motion.div style={{ y: imageY }} className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-lift ring-1 ring-slate-200/60 sm:aspect-square lg:aspect-[4/5] dark:ring-white/10">
            <ImagePlaceholder src={section.imageUrl} alt="The clinic" label="Upload a hero image in Admin -> Homepage editor" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75, duration: 0.6, ease: EASE_OUT }} className="absolute -bottom-5 -left-3 sm:-left-8">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-3 rounded-2xl bg-surface/90 p-3.5 pr-5 shadow-lift ring-1 ring-slate-100 backdrop-blur-md dark:ring-white/10">
              <span className={cn('flex size-10 items-center justify-center rounded-xl', status.open ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                <Clock className="size-5" aria-hidden />
              </span>
              <div className="text-sm">
                <p className="font-semibold text-ink">{status.open ? 'We are open today' : 'Closed today'}</p>
                <p className="text-xs text-muted">{status.label.replace(/^(Open|Closed) today, /, '')}</p>
              </div>
            </motion.div>
          </motion.div>
          <HeroOfferCard />
          {featured.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6, ease: EASE_OUT }} className="absolute -top-4 -right-2 hidden sm:block">
              <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="flex items-center gap-3 rounded-2xl bg-surface/90 p-3 pr-4 shadow-lift ring-1 ring-slate-100 backdrop-blur-md dark:ring-white/10">
                <div className="flex -space-x-3">
                  {featured.slice(0, 3).map((d) => (
                    <DoctorAvatar key={d.id} doctor={d} className="size-10 rounded-full ring-2 ring-surface" />
                  ))}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-ink">{featured.length === 1 ? featured[0].fullName : `${featured.length} practitioners`}</p>
                  <p className="text-muted">{featured.length === 1 ? featured[0].professionalTitle : featured.map((d) => d.specialties[0]?.name).filter(Boolean).join(' & ')}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <OfferTicker />
    </section>
  );
}

function Intro({ section }: { section: Section }) {
  return (
    <section className="border-y border-slate-100 bg-slate-50/50 dark:bg-surface/40">
      <div className="container-page grid grid-cols-1 gap-8 py-14 md:grid-cols-3 md:gap-12">
        <Reveal from="left" className="md:col-span-1">
          {section.subtitle && (
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-brand-700 uppercase dark:text-brand-300">
              <Sparkles className="size-3.5" aria-hidden />
              {section.subtitle}
            </p>
          )}
          {section.title && <h2 className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">{section.title}</h2>}
        </Reveal>
        <Reveal delay={0.1} className="md:col-span-2">
          <RichText text={section.body} className="text-lg leading-relaxed text-muted" />
          <CmsButtons section={section} size="md" className="mt-6" />
        </Reveal>
      </div>
    </section>
  );
}

function SectionShell({ section, children, tinted, action }: { section: Section; children: ReactNode; tinted?: boolean; action?: ReactNode }) {
  return (
    <section className={cn('py-16 sm:py-24', tinted && 'bg-gradient-to-b from-surface via-brand-50/40 to-surface dark:from-transparent dark:via-brand-500/[0.04] dark:to-transparent')}>
      <div className="container-page">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <CmsHeading section={section} />
          {action ?? <CmsButtons section={section} size="md" className="shrink-0" />}
        </Reveal>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function FeaturedDoctors({ section }: { section: Section }) {
  const { data, isLoading, isError, error, refetch } = useDoctors();
  const featured = (data ?? []).filter((d) => d.featured);
  if (!isLoading && !isError && featured.length === 0) return null;
  return (
    <SectionShell section={section}>
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)}</div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((d) => <StaggerItem key={d.id} className="h-full"><DoctorCard doctor={d} /></StaggerItem>)}
        </Stagger>
      )}
    </SectionShell>
  );
}

function Specialties({ section }: { section: Section }) {
  const { data, isLoading } = useSpecialties();
  if (!isLoading && (data ?? []).length === 0) return null;
  return (
    <SectionShell section={section} tinted>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-3xl" />)}</div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((s) => <StaggerItem key={s.id} className="h-full"><SpecialtyCard specialty={s} /></StaggerItem>)}
        </Stagger>
      )}
    </SectionShell>
  );
}

function FeaturedServices({ section }: { section: Section }) {
  const { data, isLoading, isError, error, refetch } = useServices();
  return (
    <SectionShell section={section}>
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}</div>
      ) : (
        data && (
          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.slice(0, 6).map((s) => <StaggerItem key={s.id} className="h-full"><ServiceCard service={s} /></StaggerItem>)}
          </Stagger>
        )
      )}
    </SectionShell>
  );
}

function WhyChooseUs({ section }: { section: Section }) {
  return (
    <section className="container-page py-16 sm:py-24">
      <Reveal><CmsHeading section={section} align="center" /></Reveal>
      <div className="mt-12"><CmsCards items={section.items} /></div>
    </section>
  );
}

function Testimonials({ section }: { section: Section }) {
  const { data = [] } = useTestimonials();
  if (data.length === 0) return null;
  return (
    <section className="bg-slate-50/70 py-16 sm:py-24 dark:bg-transparent">
      <div className="container-page">
        <Reveal><CmsHeading section={section} align="center" /></Reveal>
        <Stagger stagger={0.12} className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {data.map((t) => (
            <StaggerItem key={t.id} className="h-full">
              <motion.figure whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="relative flex h-full flex-col rounded-3xl border border-slate-200/80 bg-surface p-7 shadow-soft hover:shadow-lift dark:hover:shadow-glow">
                <Quote className="size-8 text-brand-200 dark:text-brand-400/50" aria-hidden />
                {t.rating ? (
                  <p className="mt-3 flex gap-0.5 text-amber-500" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="size-4 fill-current" aria-hidden />)}
                  </p>
                ) : null}
                <blockquote className="mt-4 flex-1 leading-relaxed text-slate-700">{t.quote}</blockquote>
                <figcaption className="mt-6 border-t border-slate-100 pt-4 text-sm">
                  <p className="font-semibold text-ink">{t.patientName}</p>
                  {t.context && <p className="text-muted">{t.context}</p>}
                </figcaption>
              </motion.figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function GalleryPreview({ section }: { section: Section }) {
  const { data = [] } = useGallery();
  if (data.length === 0) return null;
  return (
    <SectionShell section={section}>
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.slice(0, 6).map((g) => (
          <StaggerItem key={g.id} className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img src={g.imageUrl} alt={g.caption ?? 'Clinic photo'} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {g.caption && <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-sm text-white">{g.caption}</p>}
          </StaggerItem>
        ))}
      </Stagger>
    </SectionShell>
  );
}

function Timings({ section }: { section: Section }) {
  const { clinic } = useSite();
  const schedule = weeklySchedule(clinic);
  const status = todayStatus(clinic);
  return (
    <section className="container-page py-16 sm:py-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal from="left">
          <CmsHeading section={section} />
          <p className={cn('mt-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium', status.open ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
            <span className={cn('size-2 rounded-full', status.open ? 'bg-emerald-500' : 'bg-slate-400')} aria-hidden />
            {status.label}
          </p>
          <p className="mt-4 text-sm text-muted">
            Each doctor keeps their own consultation hours.{' '}
            <SmartLink to="/doctors" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">See doctors&apos; timings <ArrowRight className="inline size-3.5" aria-hidden /></SmartLink>
          </p>
        </Reveal>
        <Reveal from="right" className="rounded-3xl border border-slate-200 bg-surface p-2 shadow-soft">
          <table className="w-full text-sm">
            <caption className="sr-only">Clinic opening hours</caption>
            <tbody>
              {schedule.map((d, i) => (
                <motion.tr key={d.day} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: EASE_OUT }} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-5 py-3.5 text-left font-medium text-ink">{d.label}</th>
                  <td className={cn('px-5 py-3.5 text-right', d.open ? 'text-slate-600' : 'text-slate-400')}>{d.hours}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

const RENDERERS: Record<string, (s: Section) => ReactNode> = {
  hero: (s) => <Hero section={s} />,
  intro: (s) => <Intro section={s} />,
  doctors: (s) => <FeaturedDoctors section={s} />,
  specialties: (s) => <Specialties section={s} />,
  services: (s) => <FeaturedServices section={s} />,
  why_choose_us: (s) => <WhyChooseUs section={s} />,
  testimonials: (s) => <Testimonials section={s} />,
  gallery: (s) => <GalleryPreview section={s} />,
  timings: (s) => <Timings section={s} />,
  cta: (s) => <Reveal><CtaBand section={s} /></Reveal>,
};

/** Home page sections are rendered in the order (and visibility) configured in Admin -> Homepage editor. */
export default function Home() {
  const { sections, seo, isLoading, isError, error, refetch } = usePage('HOME');
  if (isLoading) return <PageLoader />;
  if (isError) {
    return (
      <div className="container-page py-20">
        <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />
      </div>
    );
  }
  // Treatment offers sit right under the hero (or at the top when the hero is hidden).
  const hasHero = sections.some((s) => s.sectionKey === 'hero');
  return (
    <>
      <Seo seo={seo} />
      {!hasHero && <TreatmentOffersSection />}
      {sections.map((s) => (
        <div key={s.id}>
          {s.core ? RENDERERS[s.sectionKey]?.(s) : <CustomSection section={s} />}
          {s.sectionKey === 'hero' && <TreatmentOffersSection />}
        </div>
      ))}
    </>
  );
}
