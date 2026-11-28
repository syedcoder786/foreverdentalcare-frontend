/**
 * Vercel Routing Middleware: link previews and search snippets for a single-page app.
 *
 * WhatsApp, Facebook, LinkedIn, X, Telegram, Slack etc. read a page's <meta> tags without running JavaScript, so
 * they only ever see the bare index.html. For those crawlers (and search engines) this middleware returns
 * index.html with the right title, description, image and canonical URL for the requested page, filled from the
 * same public API the site uses. Regular visitors are not touched: the request continues to the SPA as usual.
 */

export const config = {
  // Page routes only: skip the API proxy, built assets and any file with an extension.
  matcher: ['/((?!api/|assets/|.*\\.).*)'],
};

const CRAWLERS =
  /facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|pinterest|redditbot|skypeuripreview|applebot|googlebot|google-inspectiontool|bingbot|duckduckbot|yandex|baiduspider|embedly|quora link preview|vkshare|tumblr|bitlybot|iframely|snapchat|viber|line-poker|kakaotalk|mastodon/i;

const DEFAULT_IMAGE = '/og-image.png';
const API_TIMEOUT_MS = 2500;

type Json = Record<string, unknown>;

interface Meta {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  type: 'website' | 'profile' | 'article';
  noindex?: boolean;
  jsonLd?: Json;
}

const PAGE_KEYS: Record<string, { key: string; title?: string }> = {
  '': { key: 'HOME' },
  about: { key: 'ABOUT', title: 'About us' },
  doctors: { key: 'DOCTORS', title: 'Our doctors' },
  specialties: { key: 'SPECIALTIES', title: 'Specialties' },
  services: { key: 'SERVICES', title: 'Treatments' },
  contact: { key: 'CONTACT', title: 'Contact' },
  book: { key: 'BOOK', title: 'Book an appointment' },
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (request.method !== 'GET' || !CRAWLERS.test(request.headers.get('user-agent') ?? '')) return undefined;
  try {
    const url = new URL(request.url);
    const [shell, meta] = await Promise.all([
      fetch(new URL('/index.html', url)).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`index ${r.status}`)))),
      resolveMeta(url),
    ]);
    return new Response(inject(shell, meta, url), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
        vary: 'user-agent',
      },
    });
  } catch {
    return undefined; // never break the page: fall back to the normal SPA response
  }
}

// ------------------------------------------------------------------ data

async function api<T = Json>(origin: string, path: string): Promise<T | null> {
  try {
    const res = await fetch(`${origin}/api/public/${path}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: T };
    return body?.data ?? null;
  } catch {
    return null;
  }
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

async function resolveMeta(url: URL): Promise<Meta> {
  const origin = url.origin;
  const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [section = '', slug] = parts;

  const sitePromise = api<{ clinic?: Json }>(origin, 'site');
  const homePromise = api<{ seo?: Json }>(origin, 'pages/HOME');
  const [site, home] = await Promise.all([sitePromise, homePromise]);
  const clinic = site?.clinic ?? {};
  const name = str(clinic.clinicName) || 'Forever Dental Care';
  const siteDescription =
    str(home?.seo?.metaDescription) ||
    str(clinic.footerDescription) ||
    str(clinic.tagline) ||
    'Gentle, honest dental care. Explore treatments, meet our dentists and book an appointment online.';
  const siteImage = str(home?.seo?.ogImageUrl) || DEFAULT_IMAGE;
  const withName = (t?: string) => (t && t !== name ? `${t} | ${name}` : name);

  const base: Meta = { title: name, description: siteDescription, image: siteImage, imageAlt: name, type: 'website' };

  if (section === 'admin' || section === 'profile') return { ...base, title: withName(section === 'profile' ? 'My profile' : 'Admin'), noindex: true };

  if (slug && section === 'doctors') {
    const d = await api(origin, `doctors/by-slug/${encodeURIComponent(slug)}`);
    if (d) {
      const fullName = str(d.fullName);
      const role = str(d.professionalTitle);
      const years = typeof d.experienceYears === 'number' ? `${d.experienceYears}+ years of experience. ` : '';
      return {
        ...base,
        title: withName(role ? `${fullName}, ${role}` : fullName),
        description: str(d.shortBio) || `${years}Book an appointment with ${fullName} at ${name}.`,
        image: str(d.profileImageUrl) || siteImage,
        imageAlt: `Portrait of ${fullName}`,
        type: 'profile',
      };
    }
  }

  if (slug && section === 'services') {
    const s = (await api<{ service?: Json }>(origin, `services/${encodeURIComponent(slug)}`))?.service;
    if (s) {
      const svc = str(s.name);
      return {
        ...base,
        title: withName(svc),
        description: str(s.description) || `${svc} at ${name}. Book your treatment online.`,
        image: str(s.imageUrl) || siteImage,
        imageAlt: svc,
        type: 'article',
      };
    }
  }

  if (slug && section === 'specialties') {
    const sp = (await api<{ specialty?: Json }>(origin, `specialties/${encodeURIComponent(slug)}`))?.specialty;
    if (sp) {
      const spName = str(sp.name);
      return {
        ...base,
        title: withName(spName),
        description: str(sp.description) || `${spName} at ${name}. Meet our specialists and book online.`,
        image: str(sp.imageUrl) || siteImage,
        imageAlt: spName,
        type: 'article',
      };
    }
  }

  const page = !slug ? PAGE_KEYS[section] : undefined;
  if (page) {
    const seo = page.key === 'HOME' ? home?.seo : (await api<{ seo?: Json }>(origin, `pages/${page.key}`))?.seo;
    const meta: Meta = {
      ...base,
      title: withName(str(seo?.metaTitle) || page.title),
      description: str(seo?.metaDescription) || siteDescription,
      image: str(seo?.ogImageUrl) || siteImage,
      noindex: seo?.indexable === false,
    };
    if (page.key === 'HOME') meta.jsonLd = clinicJsonLd(clinic, name, siteDescription, origin);
    return meta;
  }

  return { ...base, title: withName('Page not found'), noindex: true };
}

function clinicJsonLd(clinic: Json, name: string, description: string, origin: string): Json {
  const sameAs = ['facebookUrl', 'instagramUrl', 'youtubeUrl', 'googleReviewsUrl'].map((k) => str(clinic[k])).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name,
    description,
    url: `${origin}/`,
    image: absolute(str(clinic.logoUrl) || DEFAULT_IMAGE, origin),
    ...(str(clinic.phone) && { telephone: str(clinic.phone) }),
    ...(str(clinic.email) && { email: str(clinic.email) }),
    ...(str(clinic.address) && { address: str(clinic.address) }),
    ...(sameAs.length && { sameAs }),
  };
}

// ------------------------------------------------------------------ html

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Plain-text, single-line description that fits preview cards. */
function clean(text: string, max = 200): string {
  const plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_#>`[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : plain;
}

function absolute(src: string, origin: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `${origin}${src.startsWith('/') ? '' : '/'}${src}`;
}

/** Cloudinary images are cropped to the 1200x630 card size (and kept small enough for WhatsApp). */
function shareImage(src: string, origin: string): { url: string; sized: boolean } {
  const url = absolute(src, origin);
  const m = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i.exec(url);
  if (m && !/^[a-z]{1,3}_[^/]*\//i.test(m[2])) {
    return { url: `${m[1]}c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/${m[2]}`, sized: true };
  }
  return { url, sized: src === DEFAULT_IMAGE };
}

function inject(shell: string, meta: Meta, url: URL): string {
  const canonical = `${url.origin}${url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '')}`;
  const description = clean(meta.description);
  const image = shareImage(meta.image, url.origin);
  const tags = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="${esc(meta.title.split(' | ').pop() ?? meta.title)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(image.url)}" />`,
    `<meta property="og:image:secure_url" content="${esc(image.url)}" />`,
    `<meta property="og:image:alt" content="${esc(meta.imageAlt)}" />`,
    ...(image.sized ? ['<meta property="og:image:width" content="1200" />', '<meta property="og:image:height" content="630" />'] : []),
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image.url)}" />`,
    `<meta name="twitter:image:alt" content="${esc(meta.imageAlt)}" />`,
    ...(meta.jsonLd ? [`<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c')}</script>`] : []),
  ].join('\n    ');

  return shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<(meta|link)\b[^>]*data-seo[^>]*>\s*/gi, '')
    .replace('</head>', `    ${tags}\n  </head>`);
}
