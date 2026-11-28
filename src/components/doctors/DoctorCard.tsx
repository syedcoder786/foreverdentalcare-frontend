import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BadgeCheck, CalendarPlus, Stethoscope } from 'lucide-react';
import type { Doctor } from '../../types';
import { LinkButton } from '../ui/Button';
import { cn } from '../../utils/cn';

/** "Dr. Faiza Khan" -> "FK" (ignores the "Dr." prefix and single-letter initials such as "S. M."). */
function initials(fullName: string): string {
  const words = fullName.replace(/^dr\.?\s+/i, '').split(/\s+/).filter((w) => w.replace(/\W/g, '').length > 1);
  const picked = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return picked.map((w) => w[0]!.toUpperCase()).join('') || 'Dr';
}

export function DoctorAvatar({ doctor, className }: { doctor: Pick<Doctor, 'profileImageUrl' | 'fullName'> & { gender?: Doctor['gender'] }; className?: string }) {
  if (doctor.profileImageUrl) {
    return (
      <div className={cn('overflow-hidden bg-brand-50', className)}>
        <img src={doctor.profileImageUrl} alt={`Portrait of ${doctor.fullName}`} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }
  const female = doctor.gender === 'FEMALE';
  return (
    <div
      role="img"
      aria-label={doctor.fullName}
      className={cn(
        '@container relative flex items-center justify-center overflow-hidden bg-gradient-to-br',
        female ? 'from-violet-100 via-rose-50 to-amber-50 text-violet-700 dark:from-violet-500/20 dark:via-rose-500/10 dark:to-transparent dark:text-violet-200'
               : 'from-brand-100 via-brand-50 to-sky-soft-100 text-brand-800 dark:text-brand-200',
        className,
      )}
    >
      <div aria-hidden className="absolute inset-0 opacity-50 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Stethoscope aria-hidden className="absolute -right-[8%] -bottom-[10%] size-[55%] rotate-12 opacity-10" />
      <span aria-hidden className="relative font-display text-[clamp(0.85rem,28cqw,5rem)] leading-none font-semibold tracking-tight">
        {initials(doctor.fullName)}
      </span>
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
