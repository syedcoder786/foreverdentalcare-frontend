import { TreatmentFee, TreatmentOfferTag } from '../offer/TreatmentOffers';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, UserRound } from 'lucide-react';
import type { DentalService } from '../../types';
import { ServiceIcon } from './ServiceIcon';
import { cn } from '../../utils/cn';

interface ServiceCardProps {
  service: DentalService;
  variant?: 'compact' | 'detailed';
  /** Hide the specialty badge (e.g. when already grouped by specialty). */
  hideSpecialty?: boolean;
}

export function ServiceCard({ service, variant = 'compact', hideSpecialty }: ServiceCardProps) {
  const detailed = variant === 'detailed';
  const doctorQuery = service.doctors.length === 1 ? `&doctor=${service.doctors[0].slug}` : '';
  return (
    <article
      id={`service-${service.id}`}
      className={cn(
        'group relative flex h-full scroll-mt-28 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-surface shadow-soft',
        'transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift',
        'dark:hover:border-brand-400/40 dark:hover:shadow-glow',
      )}
    >
      {service.imageUrl && (
        <Link to={`/services/${service.slug}`} tabIndex={-1} aria-hidden className="block aspect-[16/9] overflow-hidden">
          <img src={service.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </Link>
      )}
      <div className="relative flex flex-1 flex-col p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-brand-700 group-hover:text-white dark:text-brand-300 dark:ring-brand-400/20">
            <ServiceIcon name={service.icon} className="size-6" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {!hideSpecialty && (
              <span className="rounded-full bg-sky-soft-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-soft-700 ring-1 ring-sky-soft-200">
                {service.specialty.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
              <Clock className="size-3.5" aria-hidden />~{service.estimatedDuration} min
            </span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-ink">
          <Link to={`/services/${service.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{service.description}</p>

        {detailed && service.details.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
            {service.details.map((d) => (
              <li key={d} className="flex gap-2.5 text-sm text-slate-600">
                <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                {d}
              </li>
            ))}
          </ul>
        )}

        {service.doctors.length > 0 && (
          <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
            <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              With{' '}
              {service.doctors.map((d, i) => (
                <span key={d.id}>
                  {i > 0 && ', '}
                  <Link to={`/doctors/${d.slug}`} className="font-medium text-slate-700 hover:text-brand-700">
                    {d.fullName}
                  </Link>
                </span>
              ))}
            </span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <div className="text-sm">
            <span className="block text-xs text-slate-400">Treatment fee</span>
            <TreatmentFee service={service} />
            <TreatmentOfferTag offer={service.offer} className="mt-1 flex w-fit" />
          </div>
          <Link
            to={`/book?specialty=${service.specialty.slug}&service=${service.slug}${doctorQuery}`}
            className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
            aria-label={`Book ${service.name}`}
          >
            Book
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
