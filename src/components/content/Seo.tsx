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
}

/**
 * React 19 hoists <title> and <meta> elements rendered anywhere into <head>.
 * (Single-page apps are indexed by Google's renderer; add prerendering/SSR later if other crawlers matter.)
 */
export function Seo({ seo, title, description, image, noindex }: SeoProps) {
  const { clinic } = useSite();
  const pageTitle = seo?.metaTitle || title;
  const fullTitle = pageTitle ? `${pageTitle} | ${clinic.clinicName}` : clinic.clinicName;
  const desc = seo?.metaDescription || description;
  const og = seo?.ogImageUrl || image;
  const robots = noindex || seo?.indexable === false ? 'noindex, nofollow' : 'index, follow';
  return (
    <>
      <title>{fullTitle}</title>
      {desc && <meta name="description" content={desc} />}
      <meta name="robots" content={robots} />
      <meta property="og:title" content={fullTitle} />
      {desc && <meta property="og:description" content={desc} />}
      {og && <meta property="og:image" content={og.startsWith('http') ? og : `${window.location.origin}${og}`} />}
      <meta property="og:type" content="website" />
    </>
  );
}
