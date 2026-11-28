import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Patient } from '../../types';
import { usePatient, usePatients } from '../../hooks/useAdminData';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Input } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { ErrorMessage } from '../../components/ui/Alert';
import { DetailListSkeleton, TableSkeleton } from '../../components/ui/Skeletons';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { AppointmentDetailsModal } from '../../components/admin/AppointmentDetailsModal';
import { formatDate, formatDateTime, formatPhone, formatTime, telHref } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

function PatientModal({ id, onClose, onOpenAppointment }: { id: number | null; onClose: () => void; onOpenAppointment: (id: number) => void }) {
  const { data, isLoading, isError, error } = usePatient(id);
  return (
    <Modal open={id !== null} onClose={onClose} title={data?.patient.fullName ?? 'Patient'} size="lg">
      {isLoading && <DetailListSkeleton label="Loading patient" />}
      {isError && <ErrorMessage message={getErrorMessage(error)} />}
      {data && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
            <a href={telHref(data.patient.phone)} className="hover:text-brand-700">{formatPhone(data.patient.phone)}</a>
            {data.patient.email && <span>{data.patient.email}</span>}
            <span>First request {formatDateTime(data.patient.createdAt)}</span>
          </div>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {data.appointments.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => onOpenAppointment(a.id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50">
                  <span className="w-40 font-medium text-ink">{formatDate(a.appointmentDate)} {formatTime(a.appointmentTime)}</span>
                  <span className="min-w-0 flex-1 text-slate-600">{a.service.name} · {a.doctor.fullName}</span>
                  <StatusBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

/** Patient directory (admin only - patient data is never exposed publicly). */
export default function PatientsAdmin() {
  useDocumentTitle('Patients');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [appointment, setAppointment] = useState<number | null>(null);
  const { data, isLoading, isError, error, refetch } = usePatients({ search, page, size: 20 });

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-[38px] left-3.5 size-4 text-slate-400" aria-hidden />
        <Input label="Search patients" placeholder="Name or phone" className="pl-10" value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(0); }} />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-surface p-2 shadow-soft sm:p-3">
        {isError ? <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} /> : isLoading ? <TableSkeleton rows={8} label="Loading patients" /> : (
          <DataTable<Patient>
            caption="Patients"
            rows={data?.content ?? []}
            rowKey={(p) => p.id}
            onRowClick={(p) => setSelected(p.id)}
            columns={[
              { key: 'name', header: 'Patient', cell: (p) => <span className="font-medium text-ink">{p.fullName}</span> },
              { key: 'phone', header: 'Phone', cell: (p) => formatPhone(p.phone) },
              { key: 'email', header: 'Email', className: 'hidden lg:table-cell', cell: (p) => p.email ?? '-' },
              { key: 'count', header: 'Appointments', cell: (p) => p.appointmentCount },
              { key: 'created', header: 'First request', className: 'hidden md:table-cell', cell: (p) => <span className="text-xs text-slate-500">{formatDateTime(p.createdAt)}</span> },
            ]}
            mobileCard={(p) => (
              <button type="button" onClick={() => setSelected(p.id)} className="w-full rounded-xl border border-slate-200 p-4 text-left">
                <p className="font-semibold text-ink">{p.fullName}</p>
                <p className="text-xs text-slate-500">{formatPhone(p.phone)} · {p.appointmentCount} appointment(s)</p>
              </button>
            )}
            empty={<EmptyState title={search ? 'No matching patients' : 'No patients yet'} description="Patients are created automatically from appointment requests." />}
          />
        )}
        {data && data.totalPages > 1 && (
          <div className="border-t border-slate-100 px-2 pt-4 pb-2">
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} size={data.size} onPageChange={setPage} />
          </div>
        )}
      </div>
      <PatientModal id={selected} onClose={() => setSelected(null)} onOpenAppointment={(id) => { setSelected(null); setAppointment(id); }} />
      <AppointmentDetailsModal appointmentId={appointment} onClose={() => setAppointment(null)} />
    </div>
  );
}
