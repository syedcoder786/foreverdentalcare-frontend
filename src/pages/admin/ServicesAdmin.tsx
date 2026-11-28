import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { DentalService } from '../../types';
import { useAdminServices, useDeleteService } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ServiceFormModal } from '../../components/admin/ServiceFormModal';
import { ServiceIcon } from '../../components/services/ServiceIcon';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Spinner';
import { formatFee } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';
import { offerRange } from '../../utils/offers';
import type { ServiceOffer } from '../../types';

const OFFER_STYLE: Record<ServiceOffer['status'], { label: string; cls: string }> = {
  ACTIVE: { label: 'Running', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  SCHEDULED: { label: 'Scheduled', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  ENDED: { label: 'Ended', cls: 'bg-slate-100 text-slate-500 ring-slate-200' },
};

/** "30% off · Running · 1 Dec – 15 Dec" */
function OfferTag({ offer }: { offer?: ServiceOffer | null }) {
  if (!offer) return null;
  const st = OFFER_STYLE[offer.status];
  return (
    <span title={offerRange(offer)} className={cn('mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1', st.cls)}>
      {offer.percent}% off · {st.label} · {offerRange(offer)}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function ServicesAdmin() {
  useDocumentTitle('Services');
  const { data, isLoading, isError, error, refetch } = useAdminServices();
  const deleteMutation = useDeleteService();
  const [editing, setEditing] = useState<DentalService | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DentalService | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openForm = (s: DentalService | null) => {
    setEditing(s);
    setFormOpen(true);
    setNotice(null);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const message = await deleteMutation.mutateAsync(toDelete.id);
      setNotice(message);
      setToDelete(null);
    } catch {
      /* error rendered in modal */
    }
  };

  const actions = (s: DentalService) => (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => openForm(s)} aria-label={`Edit ${s.name}`} icon={<Pencil className="size-4" />}>
        <span className="hidden sm:inline">Edit</span>
      </Button>
      <Button
        size="sm"
        variant="ghostDanger"
        onClick={() => {
          deleteMutation.reset();
          setToDelete(s);
        }}
        aria-label={`Delete ${s.name}`}
        icon={<Trash2 className="size-4" />}
      >
        <span className="hidden sm:inline">Delete</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Manage treatments shown on the website, their descriptions and consultation fees.</p>
        <Button onClick={() => openForm(null)} icon={<Plus className="size-4" aria-hidden />}>
          Add service
        </Button>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="rounded-2xl border border-slate-200 bg-surface p-2 shadow-soft sm:p-3">
        {isError ? (
          <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : (
          <DataTable<DentalService>
            caption="Services"
            rows={data ?? []}
            rowKey={(s) => s.id}
            columns={[
              {
                key: 'name',
                header: 'Service',
                cell: (s) => (
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <ServiceIcon name={s.icon} className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{s.name}</p>
                      <p className="max-w-md truncate text-xs text-slate-500">{s.description}</p>
                    </div>
                  </div>
                ),
              },
              { key: 'specialty', header: 'Specialty', cell: (s) => <span className="whitespace-nowrap text-slate-700">{s.specialty.name}</span> },
              { key: 'doctors', header: 'Doctors', cell: (s) => s.doctors.length ? <span className="text-xs text-slate-600">{s.doctors.map((d) => d.fullName).join(', ')}</span> : <span className="text-xs text-amber-700">No doctor assigned</span> },
              { key: 'fee', header: 'Treatment fee', cell: (s) => <div><span className="whitespace-nowrap">{formatFee(s.consultationFee)}</span><br /><OfferTag offer={s.offer} /></div> },
              { key: 'duration', header: 'Duration', cell: (s) => `${s.estimatedDuration} min` },
              { key: 'status', header: 'Status', cell: (s) => <ActiveBadge active={s.active} /> },
              { key: 'actions', header: <span className="sr-only">Actions</span>, className: 'text-right', cell: actions },
            ]}
            mobileCard={(s) => (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <ServiceIcon name={s.icon} className="size-4.5" />
                    </span>
                    <p className="truncate font-semibold text-ink">{s.name}</p>
                  </div>
                  <ActiveBadge active={s.active} />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {formatFee(s.consultationFee)} &middot; {s.estimatedDuration} min
                </p>
                <OfferTag offer={s.offer} />
                <div className="mt-2 -mr-2">{actions(s)}</div>
              </div>
            )}
            empty={<EmptyState title="No services yet" description="Add your first treatment to show it on the website." />}
          />
        )}
      </div>

      <ServiceFormModal
        open={formOpen}
        service={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(message) => {
          setFormOpen(false);
          setNotice(message);
        }}
      />

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Delete service?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Keep service
            </Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          {deleteMutation.isError && <Alert tone="error">{getErrorMessage(deleteMutation.error)}</Alert>}
          <p>
            <strong className="text-ink">{toDelete?.name}</strong> will be removed from the website.
          </p>
          <p>If it already has appointments, it will be deactivated instead so that appointment history is preserved.</p>
        </div>
      </Modal>
    </div>
  );
}
