import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CalendarDays, List, Plus, Search, X } from 'lucide-react';
import type { Appointment, AppointmentFilters, AppointmentStatus } from '../../types';
import { useAdminDoctors, useAdminSpecialties, useAppointments } from '../../hooks/useAdminData';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/Alert';
import { Input, Select } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Skeleton, Spinner } from '../../components/ui/Spinner';
import { AppointmentDetailsModal } from '../../components/admin/AppointmentDetailsModal';
import { NewAppointmentModal } from '../../components/admin/NewAppointmentModal';
import { CalendarView } from '../../components/admin/calendar/CalendarView';
import { Notice } from '../../components/admin/Notice';
import { doctorColor } from '../../components/admin/doctorColors';
import { STATUS_LABELS, formatDate, formatDateTime, formatPhone, formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

const STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const PAGE_SIZE = 15;

export default function Appointments() {
  useDocumentTitle('Appointments');
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'calendar' ? 'calendar' : 'list';
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const search = useDebouncedValue(searchInput.trim());
  const status = (params.get('status') ?? '') as AppointmentStatus | '';
  const doctorId = params.get('doctorId') ? Number(params.get('doctorId')) : '';
  const specialtyId = params.get('specialtyId') ? Number(params.get('specialtyId')) : '';
  const date = params.get('date') ?? '';
  const page = Number(params.get('page') ?? 0);
  const sortBy = (params.get('sortBy') ?? 'appointmentDate') as AppointmentFilters['sortBy'];
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const doctors = useAdminDoctors();
  const specialties = useAdminSpecialties();
  const orderedIds = (doctors.data ?? []).map((d) => d.id);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((params.get('search') ?? '') !== search) updateParam('search', search);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters: AppointmentFilters = { search, status, doctorId, specialtyId, date, page, size: PAGE_SIZE, sortBy, sortDir: 'desc' };
  const { data, isLoading, isError, error, refetch, isFetching } = useAppointments(filters);
  const hasFilters = Boolean(search || status || date || doctorId || specialtyId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1" role="tablist" aria-label="View">
          {[{ key: 'list', label: 'List', icon: List }, { key: 'calendar', label: 'Calendar', icon: CalendarDays }].map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => updateParam('view', key === 'list' ? '' : key)}
              className={cn('relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium', view === key ? 'text-ink' : 'text-slate-500')}>
              {view === key && <motion.span layoutId="appt-view" className="absolute inset-0 rounded-full bg-surface shadow-soft" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <Icon className="relative size-4" aria-hidden />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreating(true)}>New appointment</Button>
      </div>

      <Notice message={notice} onClear={() => setNotice(null)} />

      {view === 'calendar' ? (
        <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-soft sm:p-5">
          <CalendarView initialDoctorId={doctorId || undefined} />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-soft">
            <div className="grid gap-3 md:grid-cols-6 xl:grid-cols-12 xl:items-end">
              <div className="relative md:col-span-6 xl:col-span-3">
                <Search className="pointer-events-none absolute top-[38px] left-3.5 size-4 text-slate-400" aria-hidden />
                <Input label="Search" placeholder="Patient name or phone" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-10" />
              </div>
              <Select label="Doctor" value={doctorId} onChange={(e) => updateParam('doctorId', e.target.value)} wrapperClassName="md:col-span-3 xl:col-span-2">
                <option value="">All doctors</option>
                {doctors.data?.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
              </Select>
              <Select label="Specialty" value={specialtyId} onChange={(e) => updateParam('specialtyId', e.target.value)} wrapperClassName="md:col-span-3 xl:col-span-2">
                <option value="">All specialties</option>
                {specialties.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Select label="Status" value={status} onChange={(e) => updateParam('status', e.target.value)} wrapperClassName="md:col-span-2 xl:col-span-1">
                <option value="">All</option>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
              <Input label="Date" type="date" value={date} onChange={(e) => updateParam('date', e.target.value)} wrapperClassName="md:col-span-2 xl:col-span-2" />
              <Select label="Sort by" value={sortBy} onChange={(e) => updateParam('sortBy', e.target.value)} wrapperClassName="md:col-span-2 xl:col-span-1">
                <option value="appointmentDate">Date</option>
                <option value="createdAt">Received</option>
                <option value="patientName">Patient</option>
                <option value="doctorName">Doctor</option>
              </Select>
              <div className="md:col-span-6 xl:col-span-1">
                {hasFilters && (
                  <Button variant="ghost" size="sm" className="h-11 w-full" icon={<X className="size-4" aria-hidden />}
                    onClick={() => { setSearchInput(''); setParams(new URLSearchParams(), { replace: true }); }}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-surface p-2 shadow-soft sm:p-3">
            <div className="flex items-center justify-between px-2 py-2">
              <p className="text-sm text-slate-500">{data ? `${data.totalElements} appointment${data.totalElements === 1 ? '' : 's'}` : ' '}</p>
              {isFetching && !isLoading && <Spinner className="size-4" label="Refreshing" />}
            </div>
            {isError ? (
              <div className="p-3"><ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} /></div>
            ) : isLoading ? (
              <div className="space-y-2 p-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : (
              <DataTable<Appointment>
                caption="Appointments"
                rows={data?.content ?? []}
                rowKey={(a) => a.id}
                onRowClick={(a) => setSelected(a.id)}
                columns={[
                  { key: 'patient', header: 'Patient', cell: (a) => (
                    <div><p className="font-medium text-ink">{a.patient.fullName}</p><p className="text-xs text-slate-500">{formatPhone(a.patient.phone)}</p></div>
                  ) },
                  { key: 'doctor', header: 'Doctor', cell: (a) => (
                    <span className="inline-flex items-center gap-2 whitespace-nowrap text-slate-700">
                      <span className={cn('size-2 rounded-full', doctorColor(a.doctor.id, orderedIds).dot)} aria-hidden />{a.doctor.fullName}
                    </span>
                  ) },
                  { key: 'service', header: 'Treatment', cell: (a) => (
                    <div><p className="text-slate-700">{a.service.name}</p><p className="text-xs text-slate-400">{a.service.specialtyName}</p></div>
                  ) },
                  { key: 'when', header: 'Date & time', cell: (a) => (
                    <div className="whitespace-nowrap"><p className="font-medium text-ink">{formatDate(a.appointmentDate)}</p><p className="text-xs text-slate-500">{formatTime(a.appointmentTime)} - {formatTime(a.endTime)}</p></div>
                  ) },
                  { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
                  { key: 'created', header: 'Requested', className: 'hidden 2xl:table-cell', cell: (a) => <span className="text-xs text-slate-500">{formatDateTime(a.createdAt)}</span> },
                  { key: 'action', header: <span className="sr-only">Actions</span>, className: 'text-right', cell: (a) => (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(a.id); }}>View</Button>
                  ) },
                ]}
                mobileCard={(a) => (
                  <button type="button" onClick={() => setSelected(a.id)} className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-brand-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{a.patient.fullName}</p>
                        <p className="text-xs text-slate-500">{a.doctor.fullName}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="truncate text-slate-600">{a.service.name}</span>
                      <span className="shrink-0 font-medium text-ink">{formatDate(a.appointmentDate, { weekday: undefined, year: undefined })} &middot; {formatTime(a.appointmentTime)}</span>
                    </div>
                  </button>
                )}
                empty={<EmptyState title={hasFilters ? 'No matching appointments' : 'No appointments yet'} description={hasFilters ? 'Try adjusting your search or filters.' : 'New appointment requests from the website will appear here.'} />}
              />
            )}
            {data && data.totalPages > 1 && (
              <div className="border-t border-slate-100 px-2 pt-4 pb-2">
                <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} size={data.size} onPageChange={(p) => updateParam('page', String(p))} />
              </div>
            )}
          </div>
        </>
      )}

      <AppointmentDetailsModal appointmentId={selected} onClose={() => setSelected(null)} />
      <NewAppointmentModal open={creating} onClose={() => setCreating(false)} onCreated={(m) => { setNotice(m); setCreating(false); }} />
    </div>
  );
}
