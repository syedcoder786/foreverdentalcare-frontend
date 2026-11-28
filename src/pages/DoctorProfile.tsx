import { useParams } from 'react-router-dom';
import { Award, BadgeCheck, Briefcase, CalendarPlus, Clock, GraduationCap } from 'lucide-react';
import { useDoctor, useServices, useSite } from '../hooks/usePublicData';
import { DoctorAvatar, SpecialtyChips } from '../components/doctors/DoctorCard';
import { ServiceCard } from '../components/services/ServiceCard';
import { RichText } from '../components/content/Cms';
import { Seo } from '../components/content/Seo';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { LinkButton } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/Alert';
import { DoctorProfileSkeleton } from '../components/ui/Skeletons';
import { DAYS_ORDER, formatFee } from '../utils/format';
import { scheduleHours, weekdayInZone } from '../utils/clinicHours';
import { WeeklyHours, shiftTiles } from '../components/hours/WeeklyHours';
import { getErrorMessage } from '../utils/errors';
import NotFound from './NotFound';
import { cn } from '../utils/cn';

export default function DoctorProfile() {
  const { slug } = useParams();
  const { data: doctor, isLoading, isError, error } = useDoctor(slug);
  const { clinic } = useSite();
  const services = useServices(doctor ? { doctorId: doctor.id } : undefined);

  if (isLoading) return <DoctorProfileSkeleton />;
  if (isError) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) return <NotFound />;
    return <div className="container-page py-20"><ErrorMessage message={getErrorMessage(error)} /></div>;
  }
  if (!doctor) return <NotFound />;

  const hasIntro = !!doctor.biography || (doctor.credentialsVerified && doctor.qualifications.length > 0);
  const bySpecialty = doctor.specialties.map((sp) => ({
    specialty: sp,
    services: (services.data ?? []).filter((s) => s.specialty.id === sp.id && doctor.services.some((ds) => ds.id === s.id)),
  }));

  return (
    <>
      <Seo title={doctor.fullName} description={doctor.shortBio ?? `${doctor.fullName}, ${doctor.professionalTitle}`} image={doctor.profileImageUrl} />
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-surface dark:from-brand-500/[0.07] dark:to-transparent">
        <div className="container-page grid grid-cols-1 gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:items-center">
          <Reveal from="left" className="lg:col-span-4">
            <DoctorAvatar doctor={doctor} className="mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] shadow-lift ring-1 ring-slate-200/70 dark:ring-white/10" />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-8">
            <SpecialtyChips doctor={doctor} />
            <h1 className="mt-4 font-display text-4xl font-semibold text-ink sm:text-5xl">{doctor.fullName}</h1>
            <p className="mt-2 flex items-center gap-2 text-lg font-medium text-brand-700 dark:text-brand-300">
              {doctor.professionalTitle}
              {doctor.credentialsVerified && <BadgeCheck className="size-5" aria-label="Credentials verified by the clinic" />}
            </p>
            {doctor.shortBio && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{doctor.shortBio}</p>}
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {doctor.experienceYears != null && (
                <div className="flex items-center gap-2"><Briefcase className="size-4 text-brand-600" aria-hidden /><dt className="sr-only">Experience</dt><dd className="text-ink">{doctor.experienceYears}+ years experience</dd></div>
              )}
              {doctor.consultationFee != null && (
                <div className="flex items-center gap-2"><dt className="text-slate-500">Consultation</dt><dd className="font-semibold text-ink">{formatFee(doctor.consultationFee)}</dd></div>
              )}
            </dl>
            <LinkButton to={`/book?doctor=${doctor.slug}`} size="lg" className="mt-8" icon={<CalendarPlus className="size-5" aria-hidden />}>
              Book with {doctor.fullName.split(' ').slice(0, 2).join(' ')}
            </LinkButton>
          </Reveal>
        </div>
      </section>

      {/* DOM order (mobile): about & qualifications, consultation hours, treatments.
          Desktop: the hours card is a sticky sidebar spanning both rows on the right. */}
      <section className="container-page grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
        {hasIntro && (
        <div className="space-y-12 lg:col-span-8 lg:col-start-1 lg:row-start-1">
          {doctor.biography && (
            <Reveal>
              <h2 className="text-xl font-semibold text-ink">About</h2>
              <RichText text={doctor.biography} className="mt-4 text-lg leading-relaxed text-muted" />
            </Reveal>
          )}
          {doctor.credentialsVerified && doctor.qualifications.length > 0 && (
            <Reveal>
              <h2 className="flex items-center gap-3 text-xl font-semibold text-ink"><GraduationCap className="size-6 text-brand-600" aria-hidden />Qualifications</h2>
              <ul className="mt-5 space-y-3">
                {doctor.qualifications.map((q, i) => (
                  <li key={i} className="rounded-2xl border border-slate-200 bg-surface p-5">
                    <p className="font-semibold text-ink">{q.degree}</p>
                    {(q.institution || q.year) && <p className="mt-1 text-sm text-muted">{[q.institution, q.year].filter(Boolean).join(', ')}</p>}
                  </li>
                ))}
              </ul>
              {doctor.registrationNumber && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <Award className="size-4 text-brand-600" aria-hidden />
                  Registration {doctor.registrationNumber}{doctor.registrationAuthority ? ` (${doctor.registrationAuthority})` : ''}
                </p>
              )}
            </Reveal>
          )}
        </div>
        )}

        <aside className="lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1">
          <Reveal from="right" className="rounded-3xl lg:sticky lg:top-28 border border-slate-200 bg-surface p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-semibold text-ink"><Clock className="size-5 text-brand-600" aria-hidden />Consultation hours</h2>
            {doctor.weekly.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Please contact the clinic for timings.</p>
            ) : (
              <WeeklyHours
                className="mt-5"
                compact
                today={weekdayInZone(clinic.timezone)}
                days={DAYS_ORDER.map((day) => {
                  const d = doctor.weekly.find((w) => w.dayOfWeek === day);
                  return { day, tiles: d && d.active !== false ? shiftTiles(scheduleHours(d)) : null };
                })}
              />
            )}
            <LinkButton to={`/book?doctor=${doctor.slug}`} fullWidth className="mt-6" icon={<CalendarPlus className="size-4" aria-hidden />}>
              Book appointment
            </LinkButton>
          </Reveal>
        </aside>

        <div className={cn('space-y-12 lg:col-span-8 lg:col-start-1', hasIntro ? 'lg:row-start-2' : 'lg:row-start-1 lg:row-span-2')}>
          {bySpecialty.map(({ specialty, services: list }) =>
            list.length > 0 ? (
              <div key={specialty.id}>
                <Reveal><h2 className="text-xl font-semibold text-ink">{specialty.name} treatments</h2></Reveal>
                <Stagger className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  {list.map((s) => <StaggerItem key={s.id} className="h-full"><ServiceCard service={s} hideSpecialty /></StaggerItem>)}
                </Stagger>
              </div>
            ) : null,
          )}
        </div>
      </section>
    </>
  );
}
