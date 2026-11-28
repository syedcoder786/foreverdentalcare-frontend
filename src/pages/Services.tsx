import { Info, Moon } from 'lucide-react';
import { TbGenderFemale } from 'react-icons/tb';
import { usePage, useServices } from '../hooks/usePublicData';
import { PageHeader } from '../components/layout/PageHeader';
import { ServiceCard } from '../components/services/ServiceCard';
import { CustomSections } from '../components/content/Cms';
import { Seo } from '../components/content/Seo';
import { ErrorMessage } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { CtaBand } from '../components/layout/CtaBand';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { getErrorMessage } from '../utils/errors';
import type { DentalService } from '../types';

/** Treatments grouped by specialty, so dental care and Unani medicine are clearly separated. */
export default function Services() {
  const { section, sections, seo } = usePage('SERVICES');
  const intro = section('intro');
  const { data, isLoading, isError, error, refetch } = useServices();

  const groups = new Map<number, { name: string; slug: string; services: DentalService[] }>();
  (data ?? []).forEach((s) => {
    const g = groups.get(s.specialty.id) ?? { name: s.specialty.name, slug: s.specialty.slug, services: [] };
    g.services.push(s);
    groups.set(s.specialty.id, g);
  });

  return (
    <>
      <Seo seo={seo} title="Treatments" />
      <PageHeader eyebrow={intro?.subtitle ?? 'Treatments'} title={intro?.title ?? 'Treatments we offer'} />
      <section className="container-page py-14 sm:py-20">
        {intro?.body && (
          <div className="mb-12 flex gap-3 rounded-2xl border border-sky-soft-200 bg-sky-soft-50 p-4 text-sm text-sky-soft-700">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>{intro.body}</p>
          </div>
        )}
        {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
        {isLoading && <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)}</div>}
        <div className="space-y-16">
          {Array.from(groups.entries()).map(([id, g]) => (
            <div key={id} id={g.slug} className="scroll-mt-28">
              <Reveal>
                {g.slug === 'unani-medicine' ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <SectionHeading eyebrow="For women only" title={g.name} />
                    <p className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-50 px-3.5 py-1.5 text-sm font-medium text-violet-700 ring-1 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25">
                      <TbGenderFemale className="size-4" aria-hidden />
                      Female doctor · Evening consultations only
                      <Moon className="size-4" aria-hidden />
                    </p>
                  </div>
                ) : (
                  <SectionHeading eyebrow="Dental care for the whole family" title={g.name} />
                )}
              </Reveal>
              <Stagger stagger={0.07} className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {g.services.map((s) => <StaggerItem key={s.id} className="h-full"><ServiceCard service={s} variant="detailed" hideSpecialty /></StaggerItem>)}
              </Stagger>
            </div>
          ))}
        </div>
        {data && data.length === 0 && <EmptyState title="No treatments listed yet" description="Please contact the clinic for information." />}
      </section>
      <CustomSections sections={sections} />
      <Reveal><CtaBand /></Reveal>
    </>
  );
}
