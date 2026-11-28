import { usePage, useSpecialties } from '../hooks/usePublicData';
import { PageHeader } from '../components/layout/PageHeader';
import { SpecialtyCard } from '../components/specialties/SpecialtyCard';
import { CustomSections } from '../components/content/Cms';
import { Seo } from '../components/content/Seo';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { ErrorMessage } from '../components/ui/Alert';
import { CardGridSkeleton } from '../components/ui/Skeletons';
import { EmptyState } from '../components/ui/EmptyState';
import { getErrorMessage } from '../utils/errors';

export default function Specialties() {
  const { section, sections, seo } = usePage('SPECIALTIES');
  const { data, isLoading, isError, error, refetch } = useSpecialties();
  const intro = section('intro');
  return (
    <>
      <Seo seo={seo} title="Specialties" />
      <PageHeader eyebrow={intro?.subtitle ?? 'Specialties'} title={intro?.title ?? 'Our specialties'} description={intro?.body} />
      <section className="container-page py-14 sm:py-20">
        {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
        {isLoading ? (
          <CardGridSkeleton kind="specialty" count={3} label="Loading specialties" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" />
        ) : data && data.length > 0 ? (
          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((s) => <StaggerItem key={s.id} className="h-full"><SpecialtyCard specialty={s} /></StaggerItem>)}
          </Stagger>
        ) : (
          !isError && <EmptyState title="No specialties listed yet" />
        )}
      </section>
      <CustomSections sections={sections} />
    </>
  );
}
