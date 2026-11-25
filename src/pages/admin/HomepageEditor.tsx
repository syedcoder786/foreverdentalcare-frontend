import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { PageSections } from '../../components/admin/content/PageSections';

/** Home page: hero, intro, featured doctors/treatments, why-choose-us, testimonials, gallery, timings and CTA. */
export default function HomepageEditor() {
  useDocumentTitle('Homepage editor');
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sky-soft-200 bg-sky-soft-50 p-4 text-sm text-sky-soft-700">
        Sections appear in <strong>display order</strong> and can be hidden. Featured doctors are chosen in each{' '}
        <Link to="/admin/doctors" className="font-semibold underline">doctor&apos;s profile</Link>; testimonials and gallery images come from their own pages.
      </div>
      <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-soft sm:p-6">
        <PageSections pageKey="HOME" />
      </div>
    </div>
  );
}
