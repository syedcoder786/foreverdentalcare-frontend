import { useState } from 'react';
import { Activity, ArrowRight, CalendarCheck2, CalendarDays, CircleCheckBig, Hourglass, Layers, Stethoscope, UserRound, XCircle } from 'lucide-react';
import { useDashboard } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { StatCard } from '../../components/admin/StatCard';
import { Stagger, StaggerItem } from '../../components/motion/Reveal';
import { AppointmentDetailsModal } from '../../components/admin/AppointmentDetailsModal';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Spinner';
import { LinkButton } from '../../components/ui/Button';
import { formatDate, formatPhone, formatTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import type { Appointment } from '../../types';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const [selected, setSelected] = useState<number | null>(null);

  if (isError) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <Stagger immediate stagger={0.06} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StaggerItem><StatCard label="Today's appointments" value={data.todaysAppointments} icon={<CalendarDays className="size-5" />} tone="violet" hint={formatDate(data.today)} to={`/admin/appointments?date=${data.today}`} /></StaggerItem>
          <StaggerItem><StatCard label="Pending requests" value={data.pendingAppointments} icon={<Hourglass className="size-5" />} tone="amber" hint="Awaiting confirmation" to="/admin/appointments?status=PENDING" /></StaggerItem>
          <StaggerItem><StatCard label="Confirmed" value={data.confirmedAppointments} icon={<CalendarCheck2 className="size-5" />} tone="sky" to="/admin/appointments?status=CONFIRMED" /></StaggerItem>
          <StaggerItem><StatCard label="Completed" value={data.completedAppointments} icon={<CircleCheckBig className="size-5" />} tone="emerald" to="/admin/appointments?status=COMPLETED" /></StaggerItem>
          <StaggerItem><StatCard label="Cancelled" value={data.cancelledAppointments} icon={<XCircle className="size-5" />} tone="slate" to="/admin/appointments?status=CANCELLED" /></StaggerItem>
          <StaggerItem><StatCard label="Total appointments" value={data.totalAppointments} icon={<Layers className="size-5" />} tone="brand" to="/admin/appointments" /></StaggerItem>
          <StaggerItem><StatCard label="Active doctors" value={data.totalDoctors} icon={<UserRound className="size-5" />} tone="brand" to="/admin/doctors" /></StaggerItem>
          <StaggerItem><StatCard label="Specialties" value={data.totalSpecialties} icon={<Layers className="size-5" />} tone="sky" to="/admin/specialties" /></StaggerItem>
          <StaggerItem><StatCard label="Active services" value={data.totalServices} icon={<Stethoscope className="size-5" />} tone="emerald" to="/admin/services" /></StaggerItem>
        </Stagger>
      )}

      <section className="rounded-2xl border border-slate-200 bg-surface shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-ink">Today&apos;s schedule</h2>
            {data && <p className="text-sm text-slate-500">{formatDate(data.today, { weekday: 'long', year: undefined })}</p>}
          </div>
          <LinkButton to="/admin/appointments?status=PENDING" variant="outline" size="sm">
            Review pending requests
            <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
        </div>
        <div className="p-2 sm:p-3">
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <DataTable<Appointment>
              caption="Today's appointments"
              rows={data?.todaysSchedule ?? []}
              rowKey={(a) => a.id}
              onRowClick={(a) => setSelected(a.id)}
              columns={[
                { key: 'time', header: 'Time', cell: (a) => <span className="font-semibold text-ink">{formatTime(a.appointmentTime)}</span> },
                {
                  key: 'patient',
                  header: 'Patient',
                  cell: (a) => (
                    <div>
                      <p className="font-medium text-ink">{a.patient.fullName}</p>
                      <p className="text-xs text-slate-500">{formatPhone(a.patient.phone)}</p>
                    </div>
                  ),
                },
                { key: 'doctor', header: 'Doctor', cell: (a) => <span className="whitespace-nowrap">{a.doctor.fullName}</span> },
                { key: 'service', header: 'Treatment', cell: (a) => a.service.name },
                { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
              ]}
              mobileCard={(a) => (
                <button type="button" onClick={() => setSelected(a.id)} className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left">
                  <span className="w-16 shrink-0 font-semibold text-ink">{formatTime(a.appointmentTime)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{a.patient.fullName}</span>
                    <span className="block truncate text-xs text-slate-500">{a.service.name}</span>
                  </span>
                  <StatusBadge status={a.status} />
                </button>
              )}
              empty={<EmptyState title="No appointments today" description="Enjoy the calm, or review pending requests." />}
            />
          )}
        </div>
      </section>

      {data && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <section className="rounded-2xl border border-slate-200 bg-surface shadow-soft xl:col-span-3">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-ink">Appointments by doctor</h2>
              <p className="text-sm text-slate-500">Every doctor has an independent calendar.</p>
            </div>
            <div className="relative overflow-x-auto p-2 sm:p-3">
              <table className="w-full text-sm">
                <thead className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>{['Doctor', 'Today', 'Pending', 'Confirmed', 'Completed', 'Cancelled', 'Total'].map((h) => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.byDoctor.map((d) => (
                    <tr key={d.doctorId}>
                      <td className="px-3 py-3"><LinkButton to={`/admin/appointments?doctorId=${d.doctorId}`} variant="ghost" size="sm" className="-ml-3">{d.doctorName}</LinkButton></td>
                      <td className="px-3 py-3 font-semibold text-ink tabular-nums">{d.today}</td>
                      <td className="px-3 py-3 text-amber-700 tabular-nums">{d.pending}</td>
                      <td className="px-3 py-3 tabular-nums">{d.confirmed}</td>
                      <td className="px-3 py-3 tabular-nums">{d.completed}</td>
                      <td className="px-3 py-3 text-slate-400 tabular-nums">{d.cancelled}</td>
                      <td className="px-3 py-3 font-semibold tabular-nums">{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-surface shadow-soft xl:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-100 p-5">
              <Activity className="size-4 text-brand-600" aria-hidden />
              <h2 className="font-semibold text-ink">Recent admin activity</h2>
            </div>
            {data.recentActivity.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No changes recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentActivity.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <p className="text-ink"><span className="font-semibold">{a.action.toLowerCase()}</span> {a.entityType}{a.summary ? ` - ${a.summary}` : ''}</p>
                    <p className="text-xs text-slate-400">{a.adminEmail} · {new Date(a.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <AppointmentDetailsModal appointmentId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
