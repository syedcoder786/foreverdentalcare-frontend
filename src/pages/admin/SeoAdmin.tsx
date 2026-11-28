import { useEffect, useState } from 'react';
import type { PageKey, Seo } from '../../types';
import { useAdminSeo, useSaveSeo } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Button } from '../../components/ui/Button';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Checkbox, Input, Textarea } from '../../components/ui/FormField';
import { Skeleton } from '../../components/ui/Spinner';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { getErrorMessage, parseApiError } from '../../utils/errors';

const LABELS: Record<PageKey, string> = {
  HOME: 'Home', ABOUT: 'About', DOCTORS: 'Our doctors', SPECIALTIES: 'Specialties', SERVICES: 'Treatments', CONTACT: 'Contact', BOOK: 'Book appointment',
};

function SeoCard({ seo }: { seo: Seo }) {
  const save = useSaveSeo();
  const [draft, setDraft] = useState(seo);
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(seo), [seo]);
  const errors = save.isError ? parseApiError(save.error).fieldErrors : {};
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft">
      <h3 className="font-semibold text-ink">{LABELS[seo.pageKey]}</h3>
      {save.isError && <Alert tone="error" className="mt-3">{parseApiError(save.error).message}</Alert>}
      {saved && <Alert tone="success" className="mt-3">Saved.</Alert>}
      <div className="mt-4 space-y-4">
        <Input label="Page title" hint={`${(draft.metaTitle ?? '').length}/70 · the clinic name is added automatically`} value={draft.metaTitle ?? ''} onChange={(e) => { setDraft({ ...draft, metaTitle: e.target.value }); setSaved(false); }} error={errors.metaTitle} />
        <Textarea label="Meta description" rows={2} hint={`${(draft.metaDescription ?? '').length}/170`} value={draft.metaDescription ?? ''} onChange={(e) => { setDraft({ ...draft, metaDescription: e.target.value }); setSaved(false); }} error={errors.metaDescription} />
        <ImageUpload label="Social sharing image (Open Graph)" hint="1200 x 630 px recommended" value={draft.ogImageUrl} onChange={(url) => { setDraft({ ...draft, ogImageUrl: url }); setSaved(false); }} />
        <Checkbox label="Allow search engines to index this page" checked={draft.indexable} onChange={(e) => { setDraft({ ...draft, indexable: e.target.checked }); setSaved(false); }} />
        <div className="flex justify-end">
          <Button size="sm" loading={save.isPending} onClick={async () => {
            try { await save.mutateAsync({ pageKey: seo.pageKey, payload: { metaTitle: draft.metaTitle, metaDescription: draft.metaDescription, ogImageUrl: draft.ogImageUrl, indexable: draft.indexable } }); setSaved(true); } catch { /* shown */ }
          }}>Save</Button>
        </div>
      </div>
    </div>
  );
}

export default function SeoAdmin() {
  useDocumentTitle('SEO settings');
  const { data, isLoading, isError, error, refetch } = useAdminSeo();
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Titles and descriptions for each page. Doctor, specialty and treatment pages use their own name and description automatically; their URL slugs are edited on their admin pages.
      </p>
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{data?.map((s) => <SeoCard key={s.pageKey} seo={s} />)}</div>
      )}
    </div>
  );
}
