import { ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ImagePlaceholderProps {
  /** Real image path (e.g. "/images/dentist.jpg"). If empty, a labelled placeholder is rendered. */
  src?: string;
  alt: string;
  label?: string;
  className?: string;
}

/** Renders the image when configured, otherwise a clearly-marked placeholder to be replaced later. */
export function ImagePlaceholder({ src, alt, label = 'Photo placeholder', className }: ImagePlaceholderProps) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={cn('h-full w-full object-cover', className)} />;
  }
  return (
    <div
      role="img"
      aria-label={`${alt} (placeholder image)`}
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden',
        'bg-[radial-gradient(circle_at_30%_20%,var(--color-brand-100),transparent_55%),radial-gradient(circle_at_80%_90%,var(--color-sky-soft-100),transparent_50%)] bg-brand-50',
        className,
      )}
    >
      <svg aria-hidden className="absolute inset-0 h-full w-full opacity-[0.07]">
        <defs>
          <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" className="text-brand-900" />
      </svg>
      <ImageIcon className="relative size-8 text-brand-600/70" aria-hidden />
      <span className="relative rounded-full bg-surface/80 px-3 py-1 text-xs font-medium text-brand-800 shadow-sm">{label}</span>
    </div>
  );
}
