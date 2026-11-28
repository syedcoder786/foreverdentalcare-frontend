import { useEffect, useState } from 'react';
import { Pencil, Plus, ShieldCheck, Star, Trash2 } from 'lucide-react';
import type { Testimonial } from '../../types';
import { useAdminTestimonials, useDeleteTestimonial, useSaveTestimonial } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/FormField';
import { EmptyState } from '../../components/ui/EmptyState';
import { Notice } from '../../components/admin/Notice';
import { getErrorMessage, parseApiError } from '../../utils/errors';
import { cn } from '../../utils/cn';
import { ListSkeleton } from '../../components/ui/Skeletons';

type Draft = Omit<Testimonial, 'id' | 'createdAt'>;
const EMPTY: Draft = { patientName: '', context: '', quote: '', rating: null, consentConfirmed: false, published: false, displayOrder: 0 };

export default function TestimonialsAdmin() {
  useDocumentTitle('Testimonials');
  const { data, isLoading, isError, error, refetch } = useAdminTestimonials();
  const save = useSaveTestimonial();
  const remove = useDeleteTestimonial();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (open) { save.reset(); setDraft(editing ? { ...editing } : EMPTY); }
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = save.isError ? parseApiError(save.error).fieldErrors : {};

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />Only publish genuine feedback, with the patient&apos;s permission recorded. Testimonials without recorded consent cannot be published.</p>
        <Button className="shrink-0" icon={<Plus className="size-4" aria-hidden />} onClick={() => { setEditing(null); setOpen(true); }}>Add testimonial</Button>
      </div>
      <Notice message={notice} onClear={() => setNotice(null)} />
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? <ListSkeleton rows={3} rowClassName="h-28" label="Loading testimonials" /> : data?.length === 0 ? (
        <EmptyState title="No testimonials yet" description="The testimonials section stays hidden on the website until you publish one." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data?.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{t.patientName}</p>
                  {t.context && <p className="text-xs text-slate-500">{t.context}</p>}
                </div>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', t.published ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200')}>
                  {t.published ? 'Published' : 'Draft'}
                </span>
              </div>
              {t.rating ? <p className="mt-2 flex gap-0.5 text-amber-500">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="size-3.5 fill-current" aria-hidden />)}</p> : null}
              <p className="mt-3 line-clamp-4 text-sm text-slate-700">“{t.quote}”</p>
              <p className="mt-3 text-xs text-slate-500">{t.consentConfirmed ? 'Consent recorded' : 'Consent NOT recorded'} · order {t.displayOrder}</p>
              <div className="mt-3 flex gap-1">
                <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => { setEditing(t); setOpen(true); }}>Edit</Button>
                <Button size="sm" variant="ghostDanger" icon={<Trash2 className="size-4" />} onClick={async () => { try { setNotice(await remove.mutateAsync(t.id)); } catch { /* toast */ } }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit testimonial' : 'Add testimonial'}
        footer={<>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button loading={save.isPending} onClick={async () => {
            try { await save.mutateAsync({ id: editing?.id, payload: { ...draft, rating: draft.rating || null } }); setOpen(false); setNotice('Testimonial saved'); } catch { /* shown */ }
          }}>Save</Button>
        </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Patient name or initials" required value={draft.patientName} onChange={(e) => setDraft({ ...draft, patientName: e.target.value })} error={errors.patientName} />
            <Input label="Context" optional placeholder="e.g. Teeth cleaning" value={draft.context ?? ''} onChange={(e) => setDraft({ ...draft, context: e.target.value })} />
          </div>
          <Textarea label="Testimonial" required rows={4} value={draft.quote} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} error={errors.quote} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Rating" value={draft.rating ?? ''} onChange={(e) => setDraft({ ...draft, rating: e.target.value ? Number(e.target.value) : null })}>
              <option value="">No rating</option>
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} stars</option>)}
            </Select>
            <Input label="Display order" inputMode="numeric" value={String(draft.displayOrder)} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value.replace(/\D/g, '') || 0) })} />
          </div>
          <Checkbox label="The patient gave permission to publish this testimonial" checked={draft.consentConfirmed} onChange={(e) => setDraft({ ...draft, consentConfirmed: e.target.checked, published: e.target.checked ? draft.published : false })} error={errors.consentConfirmed} />
          <Checkbox label="Published on the website" checked={draft.published} disabled={!draft.consentConfirmed} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
          {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
        </div>
      </Modal>
    </div>
  );
}
