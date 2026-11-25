import { CmsIcon, ICONS } from '../content/CmsIcon';

/** Kept for existing imports: services share the CMS icon set. */
export const SERVICE_ICONS = ICONS;

export function ServiceIcon({ name, className }: { name?: string; className?: string }) {
  return <CmsIcon name={name} className={className} />;
}
