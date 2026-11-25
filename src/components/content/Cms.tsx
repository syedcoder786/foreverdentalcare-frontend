import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Section } from '../../types';
import { SectionHeading } from '../ui/SectionHeading';
import { LinkButton } from '../ui/Button';
import { Reveal, Stagger, StaggerItem } from '../motion/Reveal';
import { CmsIcon } from './CmsIcon';
import { cn } from '../../utils/cn';

/** Renders body text: blank lines separate paragraphs. */
export function RichText({ text, className }: { text?: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={cn('space-y-4', className)}>
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

/** Section heading using the section's subtitle (eyebrow), title and body. */
export function CmsHeading({ section, align, as, fallbackTitle, showBody = true }: {
  section?: Section;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  fallbackTitle?: string;
  showBody?: boolean;
}) {
  const title = section?.title ?? fallbackTitle;
  if (!title) return null;
  return (
    <SectionHeading
      as={as}
      align={align}
      eyebrow={section?.subtitle}
      title={title}
      description={showBody && section?.body ? <RichText text={section.body} /> : undefined}
    />
  );
}

/** Internal paths use the router; anything else is a normal link (new tab for external). */
export function SmartLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  if (to.startsWith('/') && !to.startsWith('//')) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  const external = /^https?:/.test(to);
  return (
    <a href={to} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  );
}

export function CmsButtons({ section, size = 'lg', className, light }: { section?: Section; size?: 'md' | 'lg'; className?: string; light?: boolean }) {
  if (!section?.primaryButtonLabel && !section?.secondaryButtonLabel) return null;
  const props = (url: string) => (url.startsWith('/') ? { to: url } : { href: url });
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      {section.primaryButtonLabel && section.primaryButtonUrl && (
        <LinkButton
          {...props(section.primaryButtonUrl)}
          size={size}
          variant={light ? 'white' : 'primary'}
          className={light ? undefined : 'shadow-lg shadow-brand-700/25 hover:-translate-y-0.5 dark:shadow-brand-400/20'}
        >
          {section.primaryButtonLabel}
        </LinkButton>
      )}
      {section.secondaryButtonLabel && section.secondaryButtonUrl && (
        <LinkButton
          {...props(section.secondaryButtonUrl)}
          size={size}
          variant={light ? 'glass' : 'outline'}
          className={light ? undefined : 'hover:-translate-y-0.5 dark:border-white/15 dark:bg-white/[0.03] dark:backdrop-blur'}
        >
          {section.secondaryButtonLabel}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" aria-hidden />
        </LinkButton>
      )}
    </div>
  );
}

/** A grid of section cards (feature / facility / equipment items). */
export function CmsCards({ items, columns = 3 }: { items: Section['items']; columns?: 2 | 3 | 4 }) {
  if (!items.length) return null;
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];
  return (
    <Stagger className={cn('grid gap-5', grid)}>
      {items.map((item, i) => (
        <StaggerItem key={i} className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-soft transition-shadow hover:shadow-lift dark:hover:shadow-glow">
          {item.imageUrl && (
            <div className="aspect-[4/3] overflow-hidden">
              <img src={item.imageUrl} alt={item.title ?? ''} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          )}
          <div className="p-6">
            {item.icon && !item.imageUrl && (
              <span className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:text-brand-300">
                <CmsIcon name={item.icon} className="size-6" />
              </span>
            )}
            {item.title && <h3 className="text-lg font-semibold text-ink">{item.title}</h3>}
            {item.text && <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>}
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

/** Generic layout for admin-created custom sections. */
export function CustomSection({ section }: { section: Section }) {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className={cn('grid gap-10', section.imageUrl && 'lg:grid-cols-2 lg:items-center')}>
        <Reveal>
          <CmsHeading section={section} />
          <CmsButtons section={section} size="md" className="mt-8" />
        </Reveal>
        {section.imageUrl && (
          <Reveal from="right" className="overflow-hidden rounded-[2rem] ring-1 ring-slate-200/70 dark:ring-white/10">
            <img src={section.imageUrl} alt={section.title ?? ''} loading="lazy" className="h-full w-full object-cover" />
          </Reveal>
        )}
      </div>
      {section.items.length > 0 && (
        <div className="mt-10">
          <CmsCards items={section.items} />
        </div>
      )}
    </section>
  );
}

/** Custom (non built-in) sections of a page, rendered at the end. */
export function CustomSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.filter((s) => !s.core).map((s) => (
        <CustomSection key={s.id} section={s} />
      ))}
    </>
  );
}
