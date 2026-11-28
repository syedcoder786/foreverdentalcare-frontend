import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Specialty } from '../../types';
import { useAdminSpecialties, useDeleteSpecialty, useSaveSpecialty } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Checkbox, Input, Select, Textarea } from '../../components/ui/FormField';
import { Skeleton } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { Notice } from '../../components/admin/Notice';
import { CmsIcon, ICONS } from '../../components/content/CmsIcon';
import { getErrorMessage, parseApiError } from '../../utils/errors';

interface FormValues { name: string; slug: string; description: string; icon: string; imageUrl: string; displayOrder: string; active: boolean }

function SpecialtyForm({ specialty, open, onClose, onSaved }: { specialty: Specialty | null; open: boolean; onClose: () => void; onSaved: (m: string) => void }) {
  const save = useSaveSpecialty();
  const { register, handleSubmit, reset, watch, setValue, setError, formState: { errors } } = useForm<FormValues>();
  useEffect(() => {
    if (open) {
      save.reset();
      reset({ name: specialty?.name ?? '', slug: specialty?.slug ?? '', description: specialty?.description ?? '', icon: specialty?.icon ?? 'stethoscope',
        imageUrl: specialty?.imageUrl ?? '', displayOrder: String(specialty?.displayOrder ?? 0), active: specialty?.active ?? true });
    }
  }, [open, specialty]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ id: specialty?.id, payload: { name: v.name, slug: v.slug || undefined, description: v.description, icon: v.icon, imageUrl: v.imageUrl || undefined, displayOrder: Number(v.displayOrder || 0), active: v.active } });
      onSaved(specialty ? 'Specialty updated' : 'Specialty created');
    } catch (err) {
      Object.entries(parseApiError(err).fieldErrors).forEach(([f, m]) => setError(f as keyof FormValues, { message: m }));
    }
  });

  return (
    <Modal open={open} onClose={onClose} title={specialty ? 'Edit specialty' : 'Add specialty'} description="Specialties group treatments and practitioners (e.g. Dentistry, Unani Medicine)."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="specialty-form" loading={save.isPending}>Save</Button></>}>
      <form id="specialty-form" onSubmit={submit} noValidate className="space-y-5">
        {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Name" required error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="URL slug" optional hint="e.g. unani-medicine" error={errors.slug?.message} {...register('slug')} />
        </div>
        <Textarea label="Description" optional rows={3} error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select label="Icon" {...register('icon')}>
            {Object.entries(ICONS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
          </Select>
          <Input label="Display order" inputMode="numeric" {...register('displayOrder')} />
        </div>
        <ImageUpload label="Image (optional)" value={watch('imageUrl')} onChange={(url) => setValue('imageUrl', url)} />
        <Checkbox label="Active (shown on the website)" {...register('active')} />
      </form>
    </Modal>
  );
}

export default function SpecialtiesAdmin() {
  useDocumentTitle('Specialties');
  const { data, isLoading, isError, error, refetch } = useAdminSpecialties();
  const remove = useDeleteSpecialty();
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Create specialties, then assign them to doctors and create services under them.</p>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add specialty</Button>
      </div>
      <Notice message={notice} onClear={() => setNotice(null)} />
      <div className="rounded-2xl border border-slate-200 bg-surface p-2 shadow-soft sm:p-3">
        {isError ? <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} /> : isLoading ? <Skeleton className="h-40" /> : (
          <DataTable<Specialty>
            caption="Specialties"
            rows={data ?? []}
            rowKey={(s) => s.id}
            columns={[
              { key: 'name', header: 'Specialty', cell: (s) => (
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:text-brand-300"><CmsIcon name={s.icon} className="size-4.5" /></span>
                  <div><p className="font-medium text-ink">{s.name}</p><p className="text-xs text-slate-500">/specialties/{s.slug}</p></div>
                </div>
              ) },
              { key: 'doctors', header: 'Doctors', cell: (s) => s.doctorCount },
              { key: 'services', header: 'Active services', cell: (s) => s.serviceCount },
              { key: 'status', header: 'Status', cell: (s) => <span className={s.active ? 'text-emerald-700' : 'text-slate-400'}>{s.active ? 'Active' : 'Inactive'}</span> },
              { key: 'actions', header: <span className="sr-only">Actions</span>, className: 'text-right', cell: (s) => (
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" icon={<Pencil className="size-4" />} onClick={() => { setEditing(s); setFormOpen(true); }}>Edit</Button>
                  <Button size="sm" variant="ghostDanger" icon={<Trash2 className="size-4" />} loading={remove.isPending && remove.variables === s.id}
                    onClick={async () => { try { setNotice(await remove.mutateAsync(s.id)); } catch (e) { setNotice(getErrorMessage(e)); } }}>Delete</Button>
                </div>
              ) },
            ]}
            empty={<EmptyState title="No specialties yet" />}
          />
        )}
      </div>
      <SpecialtyForm specialty={editing} open={formOpen} onClose={() => setFormOpen(false)} onSaved={(m) => { setNotice(m); setFormOpen(false); }} />
    </div>
  );
}
