import { useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import type { PageKey } from '../../../types';
import { useAdminSections, useSaveSection } from '../../../hooks/useAdminData';
import { getErrorMessage, parseApiError } from '../../../utils/errors';
import { Input } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert, ErrorMessage } from '../../ui/Alert';
import { Skeleton } from '../../ui/Spinner';
import { SectionEditor } from './SectionEditor';

const PAGE_PATHS: Record<PageKey, string> = {
  HOME: '/', ABOUT: '/about', DOCTORS: '/doctors', SPECIALTIES: '/specialties', SERVICES: '/services', CONTACT: '/contact', BOOK: '/book',
};

/** All sections of one page, plus "add custom section". */
export function PageSections({ pageKey }: { pageKey: PageKey }) {
  const { data, isLoading, isError, error, refetch } = useAdminSections(pageKey);
  const create = useSaveSection(pageKey);
  const [key, setKey] = useState('');
  const [title, setTitle] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Changes appear on the website as soon as you save. Hidden sections are not shown.</p>
        <a href={PAGE_PATHS[pageKey]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
          Preview page<ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? <Skeleton className="h-48" /> : data?.map((s) => <SectionEditor key={s.id} section={s} pageKey={pageKey} />)}

      <div className="rounded-2xl border border-dashed border-slate-300 p-4">
        <h4 className="text-sm font-semibold text-ink">Add a custom section</h4>
        <p className="mt-1 text-xs text-slate-500">Custom sections appear after the built-in ones, with a title, text, optional image, buttons and cards.</p>
        {create.isError && <Alert tone="error" className="mt-3">{parseApiError(create.error).message}</Alert>}
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <Input label="Key" placeholder="e.g. our_promise" value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} hint="Lowercase letters, numbers, underscores" />
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button icon={<Plus className="size-4" aria-hidden />} disabled={key.length < 2} loading={create.isPending}
            onClick={async () => { try { await create.mutateAsync({ payload: { sectionKey: key, title, items: [], active: true } }); setKey(''); setTitle(''); } catch { /* shown above */ } }}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
