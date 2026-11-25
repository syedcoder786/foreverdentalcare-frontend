import type { ClinicSettings } from '../types';

/** Where "Get directions" goes: the clinic's Google Maps link if set, otherwise Google Maps directions to the address. */
export function directionsHref(clinic: Pick<ClinicSettings, 'mapLinkUrl' | 'address'>): string {
  if (clinic.mapLinkUrl) return clinic.mapLinkUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address ?? '')}`;
}

/**
 * Accepts either the embed URL itself or the whole <iframe ...> snippet copied from
 * Google Maps -> Share -> Embed a map, and returns just the src URL.
 */
export function extractEmbedSrc(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return (match ? match[1] : trimmed).replace(/&amp;/g, '&');
}
