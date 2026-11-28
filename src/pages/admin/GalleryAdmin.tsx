import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { GalleryImage } from '../../types';
import { useAdminGallery, useDeleteGalleryImage, useSaveGalleryImage } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Checkbox, Input } from '../../components/ui/FormField';
import { Skeleton } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { Notice } from '../../components/admin/Notice';
import { getErrorMessage, parseApiError } from '../../utils/errors';
import { cn } from '../../utils/cn';

type Draft = Omit<GalleryImage, 'id' | 'createdAt'>;
const EMPTY: Draft = { imageUrl: '', caption: '', category: '', displayOrder: 0, active: true };

export default function GalleryAdmin() {
  useDocumentTitle('Gallery');
  const { data, isLoading, isError, error, refetch } = useAdminGallery();
  const save = useSaveGalleryImage();
  const remove = useDeleteGalleryImage();
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [filter, setFilter] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);
  const categories = useMemo(() => Array.from(new Set((data ?? []).map((g) => g.category).filter(Boolean) as string[])), [data]);

  useEffect(() => {
    if (open) { save.reset(); setDraft(editing ? { ...editing } : EMPTY); }
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const images = (data ?? []).filter((g) => filter === 'All' || g.category === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {['All', ...categories].map((c) => (
            <button key={c} type="button" onClick={() => setFilter(c)} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium ring-1', filter === c ? 'bg-brand-700 text-white ring-brand-700' : 'text-slate-600 ring-slate-200 hover:text-ink')}>{c}</button>
          ))}
        </div>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => { setEditing(null); setOpen(true); }}>Add photo</Button>
      </div>
      <Notice message={notice} onClear={() => setNotice(null)} />
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? <Skeleton className="h-48" /> : images.length === 0 ? (
        <EmptyState title="No photos yet" description="Upload clinic photos. The gallery is hidden on the website until it has photos." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((g) => (
            <figure key={g.id} className={cn('group overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-soft', !g.active && 'opacity-50')}>
              <div className="aspect-[4/3] overflow-hidden"><img src={g.imageUrl} alt={g.caption ?? ''} className="h-full w-full object-cover" /></div>
              <figcaption className="p-3">
                <p className="truncate text-sm font-medium text-ink">{g.caption || 'No caption'}</p>
                <p className="text-xs text-slate-500">{g.category || 'Uncategorised'} · order {g.displayOrder}{g.active ? '' : ' · hidden'}</p>
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="ghost" aria-label="Edit" icon={<Pencil className="size-4" />} onClick={() => { setEditing(g); setOpen(true); }} />
                  <Button size="sm" variant="ghostDanger" aria-label="Delete" icon={<Trash2 className="size-4" />} onClick={async () => { try { setNotice(await remove.mutateAsync(g.id)); } catch { /* toast */ } }} />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit photo' : 'Add photo'}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={save.isPending} disabled={!draft.imageUrl} onClick={async () => {
            try { await save.mutateAsync({ id: editing?.id, payload: draft }); setOpen(false); setNotice('Photo saved'); } catch { /* shown */ }
          }}>Save</Button>
        </>}>
        <div className="space-y-4">
          <ImageUpload label="Photo" value={draft.imageUrl} onChange={(url) => setDraft({ ...draft, imageUrl: url })} />
          <Input label="Caption" optional value={draft.caption ?? ''} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Category" optional list="gallery-categories" placeholder="e.g. Treatment rooms" value={draft.category ?? ''} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            <datalist id="gallery-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            <Input label="Display order" inputMode="numeric" value={String(draft.displayOrder)} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value.replace(/\D/g, '') || 0) })} />
          </div>
          <Checkbox label="Visible on website" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
          {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
        </div>
      </Modal>
    </div>
  );
}
