import { useState } from 'react';
import { motion } from 'motion/react';
import { useDoctors, usePage, useSpecialties } from '../hooks/usePublicData';
import { PageHeader } from '../components/layout/PageHeader';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { CustomSections } from '../components/content/Cms';
import { Seo } from '../components/content/Seo';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { ErrorMessage } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { getErrorMessage } from '../utils/errors';
import { cn } from '../utils/cn';

export default function Doctors() {
  const [specialtyId, setSpecialtyId] = useState<number | undefined>();
  const { section, sections, seo } = usePage('DOCTORS');
  const specialties = useSpecialties();
  const { data, isLoading, isError, error, refetch } = useDoctors(specialtyId);
  const intro = section('intro');

  return (
    <>
      <Seo seo={seo} title="Our doctors" />
      <PageHeader eyebrow={intro?.subtitle ?? 'Our team'} title={intro?.title ?? 'Our doctors'} description={intro?.body} />
      <section className="container-page py-14 sm:py-20">
        {(specialties.data?.length ?? 0) > 1 && (
          <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter by specialty">
            {[{ id: undefined, name: 'All' }, ...(specialties.data ?? [])].map((s) => {
              const active = specialtyId === s.id;
              return (
                <button key={s.name} type="button" role="tab" aria-selected={active} onClick={() => setSpecialtyId(s.id)}
                  className={cn('relative rounded-full px-4 py-2 text-sm font-medium transition-colors', active ? 'text-white' : 'text-slate-600 ring-1 ring-slate-200 hover:text-ink')}>
                  {active && <motion.span layoutId="doctor-filter" className="absolute inset-0 rounded-full bg-brand-700" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative">{s.name}</span>
                </button>
              );
            })}
          </div>
        )}
        {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[28rem] rounded-3xl" />)}</div>
        ) : data && data.length > 0 ? (
          <Stagger key={specialtyId ?? 'all'} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((d) => <StaggerItem key={d.id} className="h-full"><DoctorCard doctor={d} /></StaggerItem>)}
          </Stagger>
        ) : (
          !isError && <EmptyState title="No doctors listed yet" description="Please contact the clinic for information." />
        )}
      </section>
      <CustomSections sections={sections} />
    </>
  );
}
