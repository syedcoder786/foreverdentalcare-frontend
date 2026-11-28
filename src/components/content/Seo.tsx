import { useLocation } from 'react-router-dom';
import { useSite } from '../../hooks/usePublicData';
import type { Seo as SeoData } from '../../types';

interface SeoProps {
  /** Page-level SEO settings managed in Admin -> SEO. */
  seo?: SeoData;
  /** Fallback title/description for dynamic pages (doctor, service, specialty). */
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'profile' | 'article';
}

/** Shipped in /public: the branded 1200x630 card used when a page has no image of its own. */
export const DEFAULT_SHARE_IMAGE = '/og-image.png';

function absolute(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  return `${window.location.origin}${src.startsWith('/') ? '' : '/'}${src}`;
}

function plain(text: string, max = 200): string {
  const t = text.replace(/<[^>]+>/g, ' ').replace(/[*_#>`[\]]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : t;
}

/**
 * Title, description, canonical, Open Graph and Twitter tags for the current page.
 * React 19 hoists these into <head>. Link-preview crawlers don't run JavaScript, so they get the same tags
 * server side from middleware.ts; keep the two in step.
 */
export function Seo({ seo, title, description, image, noindex, type = 'website' }: SeoProps) {
  const { clinic } = useSite();
  const { pathname } = useLocation();
  const pageTitle = seo?.metaTitle || title;
  const fullTitle = pageTitle && pageTitle !== clinic.clinicName ? `${pageTitle} | ${clinic.clinicName}` : clinic.clinicName;
  const desc = plain(seo?.metaDescription || description || clinic.footerDescription || clinic.tagline || '');
  const og = absolute(seo?.ogImageUrl || image || DEFAULT_SHARE_IMAGE);
  const robots = noindex || seo?.indexable === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  const url = `${window.location.origin}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
  return (
    <>
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={clinic.clinicName} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      <meta property="og:image" content={og} />
      <meta property="og:image:alt" content={pageTitle || clinic.clinicName} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {desc && <meta name="twitter:description" content={desc} />}
      <meta name="twitter:image" content={og} />
    </>
  );
}
