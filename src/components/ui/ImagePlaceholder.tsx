import { cn } from '../../utils/cn';
import { DentalScene } from './Illustrations';

interface ImagePlaceholderProps {
  /** Real image path (e.g. "/images/dentist.jpg"). If empty, the clinic's dental illustration is shown instead. */
  src?: string;
  alt: string;
  className?: string;
}

/** Renders the uploaded image when there is one, otherwise a branded dental illustration (never placeholder text). */
export function ImagePlaceholder({ src, alt, className }: ImagePlaceholderProps) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={cn('h-full w-full object-cover', className)} />;
  }
  return <DentalScene title={alt} className={className} />;
}
