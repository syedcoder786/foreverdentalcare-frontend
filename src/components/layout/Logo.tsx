import { Link } from 'react-router-dom';
import { useSite } from '../../hooks/usePublicData';
import { cn } from '../../utils/cn';

export function ToothMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" className="fill-brand-700" />
      <path
        d="M16 8.5c-2-1.5-6.5-2-8 1.5-1.25 3 .5 6 1.25 8.5.6 2 .75 5 2.25 5s1.5-3.5 2.5-5c.5-.75 1.5-.75 2 0 1 1.5 1 5 2.5 5s1.65-3 2.25-5c.75-2.5 2.5-5.5 1.25-8.5-1.5-3.5-6-3-8-1.5z"
        className="fill-white"
      />
    </svg>
  );
}

/** Clinic logo (uploaded in Admin -> Clinic settings) or the default mark, with name and tagline. */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  const { clinic } = useSite();
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)} aria-label={`${clinic.clinicName} home`}>
      {clinic.logoUrl ? (
        <img src={clinic.logoUrl} alt="" className="size-9 shrink-0 rounded-xl object-contain" />
      ) : (
        <ToothMark className="size-9 shrink-0" />
      )}
      <span className="leading-tight">
        <span className={cn('block font-display text-lg font-semibold', light ? 'text-white' : 'text-ink')}>{clinic.clinicName}</span>
        {clinic.tagline && (
          <span className={cn('block text-[11px] font-medium tracking-wide', light ? 'text-mint' : 'text-muted')}>{clinic.tagline}</span>
        )}
      </span>
    </Link>
  );
}
