import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import type { PageKey } from '../../types';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageSections } from '../../components/admin/content/PageSections';
import { NavigationEditor } from '../../components/admin/content/NavigationEditor';
import { BrandingForm } from '../../components/admin/content/BrandingForm';
import { cn } from '../../utils/cn';

const TABS = [
  { key: 'ABOUT', label: 'About page' },
  { key: 'DOCTORS', label: 'Doctors page' },
  { key: 'SPECIALTIES', label: 'Specialties page' },
  { key: 'SERVICES', label: 'Treatments page' },
  { key: 'CONTACT', label: 'Contact page' },
  { key: 'BOOK', label: 'Booking page' },
  { key: 'navigation', label: 'Navigation menu' },
  { key: 'branding', label: 'Header & footer' },
] as const;

/** Every public page's text, the menu, and header/footer content (the home page has its own editor). */
export default function WebsiteContent() {
  useDocumentTitle('Website content');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'ABOUT';

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-surface p-1.5 shadow-soft" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setParams({ tab: t.key }, { replace: true })}
            className={cn('relative shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium', tab === t.key ? 'text-white' : 'text-slate-600 hover:text-ink')}>
            {tab === t.key && <motion.span layoutId="content-tab" className="absolute inset-0 rounded-xl bg-brand-700" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-soft sm:p-6">
        {tab === 'navigation' ? <NavigationEditor /> : tab === 'branding' ? <BrandingForm /> : <PageSections pageKey={tab as PageKey} />}
      </motion.div>
    </div>
  );
}
