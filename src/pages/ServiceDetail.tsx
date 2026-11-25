import { Link, useParams } from 'react-router-dom';
import { CalendarPlus, Check, Clock } from 'lucide-react';
import { useService } from '../hooks/usePublicData';
import { PageHeader } from '../components/layout/PageHeader';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { Seo } from '../components/content/Seo';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { SectionHeading } from '../components/ui/SectionHeading';
import { LinkButton } from '../components/ui/Button';
import { ErrorMessage } from '../components/ui/Alert';
import { PageLoader } from '../components/ui/Spinner';
import { formatFee } from '../utils/format';
import { getErrorMessage } from '../utils/errors';
import NotFound from './NotFound';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useService(slug);
  if (isLoading) return <PageLoader />;
  if (isError) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) return <NotFound />;
    return <div className="container-page py-20"><ErrorMessage message={getErrorMessage(error)} /></div>;
  }
  if (!data) return <NotFound />;
  const { service, doctors } = data;
  const doctorParam = doctors.length === 1 ? `&doctor=${doctors[0].slug}` : '';

  return (
    <>
      <Seo title={service.name} description={service.description} image={service.imageUrl} />
      <PageHeader eyebrow={service.specialty.name} title={service.name} description={service.description}>
        <div className="flex flex-wrap items-center gap-4">
          <LinkButton to={`/book?specialty=${service.specialty.slug}&service=${service.slug}${doctorParam}`} size="lg" icon={<CalendarPlus className="size-5" aria-hidden />}>
            Book this treatment
          </LinkButton>
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600"><Clock className="size-4" aria-hidden />~{service.estimatedDuration} min per visit</span>
          <span className="text-sm text-slate-600">Fee: <strong className="text-ink">{formatFee(service.consultationFee)}</strong></span>
        </div>
      </PageHeader>

      <section className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {service.imageUrl && <Reveal><img src={service.imageUrl} alt="" className="mb-10 w-full rounded-[2rem] object-cover shadow-lift" /></Reveal>}
          {service.details.length > 0 && (
            <Reveal>
              <h2 className="text-xl font-semibold text-ink">What to expect</h2>
              <ul className="mt-5 space-y-3">
                {service.details.map((d) => (
                  <li key={d} className="flex gap-3 text-slate-700"><Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />{d}</li>
                ))}
              </ul>
            </Reveal>
          )}
          <p className="mt-10 text-sm text-muted">
            General information only. Suitability is decided after a consultation. Part of{' '}
            <Link to={`/specialties/${service.specialty.slug}`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">{service.specialty.name}</Link>.
          </p>
        </div>
        {doctors.length > 0 && (
          <aside className="lg:col-span-5">
            <Reveal><SectionHeading title={doctors.length === 1 ? 'Your practitioner' : 'Practitioners'} /></Reveal>
            <Stagger className="mt-6 grid gap-5">
              {doctors.map((d) => <StaggerItem key={d.id}><DoctorCard doctor={d} /></StaggerItem>)}
            </Stagger>
          </aside>
        )}
      </section>
    </>
  );
}
