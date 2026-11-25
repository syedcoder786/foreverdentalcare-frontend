import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useAdminDoctors, useDeleteDoctor } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { DoctorAvatar } from '../../components/doctors/DoctorCard';
import { Button, LinkButton } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Notice } from '../../components/admin/Notice';
import { Stagger, StaggerItem } from '../../components/motion/Reveal';
import { getErrorMessage } from '../../utils/errors';
import { DAY_LABELS, formatTime } from '../../utils/format';
import type { AdminDoctor } from '../../types';
import { cn } from '../../utils/cn';

function hoursSummary(d: AdminDoctor) {
  const active = d.weekly.filter((w) => w.active);
  if (active.length === 0) return 'No working days set';
  const first = active[0];
  const same = active.every((w) => w.startTime === first.startTime && w.endTime === first.endTime);
  const days = active.map((w) => DAY_LABELS[w.dayOfWeek].short).join(', ');
  return same ? `${days} · ${formatTime(first.startTime)} - ${formatTime(first.endTime)}` : `${days} · varying hours`;
}

export default function DoctorsAdmin() {
  useDocumentTitle('Doctors');
  const { data, isLoading, isError, error, refetch } = useAdminDoctors();
  const deleteMutation = useDeleteDoctor();
  const [toDelete, setToDelete] = useState<AdminDoctor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Each doctor has an independent profile, services, schedule and appointment calendar.</p>
        <LinkButton to="/admin/doctors/new" icon={<Plus className="size-4" aria-hidden />}>Add doctor</LinkButton>
      </div>
      <Notice message={notice} onClear={() => setNotice(null)} />
      {isError && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44" />)}</div>
      ) : data && data.length === 0 ? (
        <EmptyState title="No doctors yet" description="Add the first practitioner to start taking bookings." />
      ) : (
        <Stagger immediate className="grid gap-4 md:grid-cols-2">
          {data?.map((d) => (
            <StaggerItem key={d.id} className={cn('flex gap-4 rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft', !d.active && 'opacity-60')}>
              <DoctorAvatar doctor={d} className="size-20 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/admin/doctors/${d.id}`} className="truncate text-lg font-semibold text-ink hover:text-brand-700">{d.fullName}</Link>
                  {!d.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">Inactive</span>}
                </div>
                <p className="text-sm text-slate-500">{d.professionalTitle}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs">
                  {d.credentialsVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700"><BadgeCheck className="size-3.5" aria-hidden />Credentials verified</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700"><ShieldAlert className="size-3.5" aria-hidden />Credentials not verified (hidden publicly)</span>
                  )}
                </p>
                <p className="mt-2 text-xs text-slate-500">{d.specialties.map((s) => s.name).join(', ') || 'No specialty'} · {d.services.length} service{d.services.length === 1 ? '' : 's'}</p>
                <p className="text-xs text-slate-500">{hoursSummary(d)}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <LinkButton to={`/admin/doctors/${d.id}`} size="sm" variant="ghost" icon={<Pencil className="size-4" aria-hidden />}>Edit</LinkButton>
                  <LinkButton to={`/admin/doctors/${d.id}?tab=calendar`} size="sm" variant="ghost" icon={<CalendarDays className="size-4" aria-hidden />}>Calendar</LinkButton>
                  <Button size="sm" variant="ghostDanger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => { deleteMutation.reset(); setToDelete(d); }}>Delete</Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Delete doctor?" size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setToDelete(null)}>Keep</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={async () => {
            if (!toDelete) return;
            try { setNotice(await deleteMutation.mutateAsync(toDelete.id)); setToDelete(null); } catch { /* shown below */ }
          }}>Delete</Button>
        </>}>
        <div className="space-y-3 text-sm text-slate-600">
          {deleteMutation.isError && <ErrorMessage message={getErrorMessage(deleteMutation.error)} />}
          <p><strong className="text-ink">{toDelete?.fullName}</strong> will be removed from the website.</p>
          <p>If the doctor has appointment history, the profile is deactivated instead so that past appointments are preserved.</p>
        </div>
      </Modal>
    </div>
  );
}
