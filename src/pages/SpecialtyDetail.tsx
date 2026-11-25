import { useParams } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { useSpecialty } from '../hooks/usePublicData';
import { PageHeader } from '../components/layout/PageHeader';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { ServiceCard } from '../components/services/ServiceCard';
import { Seo } from '../components/content/Seo';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { LinkButton } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/Alert';
import { PageLoader } from '../components/ui/Spinner';
import { getErrorMessage } from '../utils/errors';
import NotFound from './NotFound';

export default function SpecialtyDetail() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useSpecialty(slug);
  if (isLoading) return <PageLoader />;
  if (isError) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) return <NotFound />;
    return <div className="container-page py-20"><ErrorMessage message={getErrorMessage(error)} /></div>;
  }
  if (!data) return <NotFound />;
  const { specialty, doctors, services } = data;

  return (
    <>
      <Seo title={specialty.name} description={specialty.description} image={specialty.imageUrl} />
      <PageHeader eyebrow="Specialty" title={specialty.name} description={specialty.description}>
        <LinkButton to={`/book?specialty=${specialty.slug}`} size="lg" icon={<CalendarPlus className="size-5" aria-hidden />}>
          Book a {specialty.name} appointment
        </LinkButton>
      </PageHeader>

      {doctors.length > 0 && (
        <section className="container-page py-14 sm:py-20">
          <Reveal><SectionHeading eyebrow="Practitioners" title={`${specialty.name} doctors`} /></Reveal>
          <Stagger className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => <StaggerItem key={d.id} className="h-full"><DoctorCard doctor={d} /></StaggerItem>)}
          </Stagger>
        </section>
      )}

      {services.length > 0 && (
        <section className="container-page pb-20">
          <Reveal><SectionHeading eyebrow="Treatments" title={`${specialty.name} treatments`} /></Reveal>
          <Stagger className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => <StaggerItem key={s.id} className="h-full"><ServiceCard service={s} variant="detailed" hideSpecialty /></StaggerItem>)}
          </Stagger>
        </section>
      )}
    </>
  );
}
