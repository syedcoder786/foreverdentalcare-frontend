import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2';
}

export function SectionHeading({ eyebrow, title, description, align = 'left', className, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-brand-700 uppercase">
          <span className="h-px w-6 bg-brand-400" aria-hidden />
          {eyebrow}
        </p>
      )}
      <Tag className="font-display text-3xl leading-tight font-semibold text-ink sm:text-4xl">{title}</Tag>
      {description && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
    </div>
  );
}
