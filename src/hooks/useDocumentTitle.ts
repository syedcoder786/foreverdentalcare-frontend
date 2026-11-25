import { useEffect } from 'react';
import { useSite } from './usePublicData';

/** Sets the browser tab title for admin pages (public pages use the <Seo> component). */
export function useDocumentTitle(title?: string) {
  const { clinic } = useSite();
  useEffect(() => {
    document.title = title ? `${title} | ${clinic.clinicName}` : clinic.clinicName;
  }, [title, clinic.clinicName]);
}
