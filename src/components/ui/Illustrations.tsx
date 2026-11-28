import { CmsIcon } from '../content/CmsIcon';
import { cn } from '../../utils/cn';

/** Molar outline centred on (0, 0), roughly 210 x 210 units. */
const TOOTH =
  'M-60-70C-95-70-110-40-105-5C-100 30-85 45-80 80C-76 110-70 140-55 140C-40 140-35 110-30 80C-26 60-15 50 0 50C15 50 26 60 30 80C35 110 40 140 55 140C70 140 76 110 80 80C85 45 100 30 105-5C110-40 95-70 60-70C35-70 20-58 0-58C-20-58-35-70-60-70Z';
const SPARKLE = 'M0-14C1.6-4 4-1.6 14 0C4 1.6 1.6 4 0 14C-1.6 4-4 1.6-14 0C-4-1.6-1.6-4 0-14Z';

/**
 * Decorative dental illustration (healthy tooth, brush, sparkles). Colours come from the theme variables, so it adapts
 * to dark mode. Shown wherever the clinic has not uploaded its own photo.
 */
export function DentalScene({ className, title = 'Illustration of a healthy, shining tooth' }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 400 500" role="img" aria-label={title} preserveAspectRatio="xMidYMid slice" className={cn('h-full w-full', className)}>
      <defs>
        <linearGradient id="ds-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-brand-50)" />
          <stop offset="0.55" stopColor="var(--color-brand-100)" />
          <stop offset="1" stopColor="var(--color-sky-soft-100)" />
        </linearGradient>
        <linearGradient id="ds-tooth" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6f4f2" />
        </linearGradient>
        <linearGradient id="ds-handle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-brand-400)" />
          <stop offset="1" stopColor="var(--color-brand-700)" />
        </linearGradient>
        <filter id="ds-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#0f766e" floodOpacity="0.22" />
        </filter>
        <pattern id="ds-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill="var(--color-brand-700)" opacity="0.12" />
        </pattern>
      </defs>

      <rect width="400" height="500" fill="url(#ds-bg)" />
      <rect width="400" height="500" fill="url(#ds-dots)" />
      <circle cx="330" cy="70" r="120" fill="#ffffff" opacity="0.35" />
      <circle cx="40" cy="450" r="140" fill="var(--color-sky-soft-200)" opacity="0.45" />
      <circle cx="200" cy="255" r="150" fill="#ffffff" opacity="0.5" />
      <circle cx="200" cy="255" r="150" fill="none" stroke="var(--color-brand-300)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 10" />

      {/* Toothbrush, behind the tooth */}
      <g transform="translate(300 330) rotate(-38)">
        <rect x="-12" y="-150" width="24" height="210" rx="12" fill="url(#ds-handle)" />
        <rect x="-16" y="-205" width="32" height="62" rx="10" fill="var(--color-brand-600)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="-30" y={-200 + i * 11} width="18" height="7" rx="3.5" fill="#ffffff" />
        ))}
      </g>

      {/* Tooth */}
      <g transform="translate(200 235) scale(1.05)" filter="url(#ds-shadow)">
        <path d={TOOTH} fill="url(#ds-tooth)" stroke="var(--color-brand-200)" strokeWidth="3" />
        <path d="M-72-38C-74-55-60-62-44-60" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" opacity="0.95" />
        <circle cx="-30" cy="5" r="7" fill="var(--color-brand-800)" />
        <circle cx="30" cy="5" r="7" fill="var(--color-brand-800)" />
        <path d="M-24 26C-10 40 10 40 24 26" fill="none" stroke="var(--color-brand-800)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="-50" cy="24" r="9" fill="#fda4af" opacity="0.55" />
        <circle cx="50" cy="24" r="9" fill="#fda4af" opacity="0.55" />
      </g>

      {/* Sparkles */}
      <path d={SPARKLE} transform="translate(92 140) scale(1.6)" fill="#ffffff" />
      <path d={SPARKLE} transform="translate(318 210) scale(1.1)" fill="var(--color-brand-400)" />
      <path d={SPARKLE} transform="translate(110 360) scale(0.9)" fill="var(--color-sky-soft-500)" opacity="0.8" />
      <path d={SPARKLE} transform="translate(250 105) scale(0.7)" fill="var(--color-brand-500)" />

      {/* Shield badge */}
      <g transform="translate(78 250)">
        <circle r="30" fill="#ffffff" filter="url(#ds-shadow)" />
        <path d="M0-16L13-11V-1C13 8 7 14 0 17C-7 14-13 8-13-1V-11Z" fill="var(--color-brand-100)" stroke="var(--color-brand-600)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-6 0L-1 5L7-4" fill="none" stroke="var(--color-brand-700)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

type CoverTone = 'dental' | 'unani';

const TONES: Record<CoverTone, { bg: string; badge: string; ghost: string }> = {
  dental: {
    bg: 'from-brand-50 via-brand-100/70 to-sky-soft-100',
    badge: 'text-brand-700 ring-brand-200 dark:text-brand-300 dark:ring-brand-400/30',
    ghost: 'text-brand-600/15 dark:text-brand-300/10',
  },
  unani: {
    bg: 'from-violet-50 via-rose-50 to-amber-50 dark:from-violet-500/10 dark:via-rose-500/10 dark:to-amber-500/5',
    badge: 'text-violet-600 ring-violet-200 dark:text-violet-300 dark:ring-violet-400/30',
    ghost: 'text-violet-500/15 dark:text-violet-300/10',
  },
};

/** Branded cover for a treatment that has no uploaded photo: soft gradient, dot texture and the treatment icon. */
export function ServiceCover({ icon, specialtySlug, className }: { icon?: string; specialtySlug?: string; className?: string }) {
  const tone = TONES[specialtySlug === 'unani-medicine' ? 'unani' : 'dental'];
  return (
    <div aria-hidden className={cn('relative flex items-center justify-center overflow-hidden bg-gradient-to-br', tone.bg, className)}>
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgb(15_118_110/0.12)_1.2px,transparent_1.2px)] [background-size:16px_16px]" />
      <CmsIcon name={icon} className={cn('absolute -right-6 -bottom-8 size-40 rotate-12', tone.ghost)} />
      <span className={cn('relative flex size-20 items-center justify-center rounded-3xl bg-surface/90 shadow-lift ring-1 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6', tone.badge)}>
        <CmsIcon name={icon} className="size-10" />
      </span>
    </div>
  );
}
