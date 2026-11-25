import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BadgeCheck, CalendarPlus, UserRound } from 'lucide-react';
import type { Doctor } from '../../types';
import { LinkButton } from '../ui/Button';
import { cn } from '../../utils/cn';

export function DoctorAvatar({ doctor, className }: { doctor: Pick<Doctor, 'profileImageUrl' | 'fullName'>; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center overflow-hidden bg-brand-50 text-brand-600 dark:text-brand-300', className)}>
      {doctor.profileImageUrl ? (
        <img src={doctor.profileImageUrl} alt={`Portrait of ${doctor.fullName}`} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <UserRound className="size-1/3" aria-hidden />
      )}
    </div>
  );
}

/** Specialty chips. Unani and dental care are labelled clearly so patients can tell them apart. */
export function SpecialtyChips({ doctor, className }: { doctor: Doctor; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {doctor.specialties.map((s) => (
        <Link
          key={s.id}
          to={`/specialties/${s.slug}`}
          className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-100 hover:bg-brand-100 dark:text-brand-300 dark:ring-brand-400/20"
        >
          {s.name}
        </Link>
      ))}
      {doctor.gender === 'FEMALE' && (
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600 ring-1 ring-violet-200 dark:ring-violet-400/20">
          Female practitioner
        </span>
      )}
    </div>
  );
}

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-surface shadow-soft hover:shadow-lift dark:hover:shadow-glow"
    >
      <Link to={`/doctors/${doctor.slug}`} className="relative block aspect-[4/3] overflow-hidden" tabIndex={-1} aria-hidden>
        <DoctorAvatar doctor={doctor} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <SpecialtyChips doctor={doctor} />
        <h3 className="mt-3 text-xl font-semibold text-ink">
          <Link to={`/doctors/${doctor.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">
            {doctor.fullName}
          </Link>
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-300">
          {doctor.professionalTitle}
          {doctor.credentialsVerified && <BadgeCheck className="size-4" aria-label="Credentials verified by the clinic" />}
        </p>
        {doctor.shortBio && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{doctor.shortBio}</p>}
        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <LinkButton to={`/doctors/${doctor.slug}`} variant="outline" size="sm">
            View profile
          </LinkButton>
          <LinkButton to={`/book?doctor=${doctor.slug}`} size="sm" icon={<CalendarPlus className="size-4" aria-hidden />}>
            Book appointment
          </LinkButton>
        </div>
      </div>
    </motion.article>
  );
}
