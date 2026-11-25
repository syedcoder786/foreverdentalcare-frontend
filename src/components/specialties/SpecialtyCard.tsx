import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Specialty } from '../../types';
import { CmsIcon } from '../content/CmsIcon';

export function SpecialtyCard({ specialty }: { specialty: Specialty }) {
  return (
    <Link
      to={`/specialties/${specialty.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-surface p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift dark:hover:border-brand-400/40 dark:hover:shadow-glow"
    >
      {specialty.imageUrl && (
        <img src={specialty.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-10 transition-opacity group-hover:opacity-20" />
      )}
      <span className="relative inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:scale-110 group-hover:bg-brand-700 group-hover:text-white dark:text-brand-300 dark:ring-brand-400/20">
        <CmsIcon name={specialty.icon} className="size-7" />
      </span>
      <h3 className="relative mt-5 text-xl font-semibold text-ink">{specialty.name}</h3>
      {specialty.description && <p className="relative mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{specialty.description}</p>}
      <p className="relative mt-auto flex items-center justify-between pt-6 text-sm">
        <span className="text-slate-500">
          {specialty.doctorCount} doctor{specialty.doctorCount === 1 ? '' : 's'} &middot; {specialty.serviceCount} treatment
          {specialty.serviceCount === 1 ? '' : 's'}
        </span>
        <ArrowRight className="size-4 text-brand-700 transition-transform group-hover:translate-x-1 dark:text-brand-300" aria-hidden />
      </p>
    </Link>
  );
}
