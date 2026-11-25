import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAdminDoctor, useDoctorSchedule } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { DoctorProfileForm } from '../../components/admin/doctor/DoctorProfileForm';
import { DoctorScheduleForm } from '../../components/admin/doctor/DoctorScheduleForm';
import { BlockedTimeManager } from '../../components/admin/doctor/BlockedTimeManager';
import { DoctorDayView } from '../../components/admin/calendar/DoctorDayView';
import { CalendarView } from '../../components/admin/calendar/CalendarView';
import { Notice } from '../../components/admin/Notice';
import { ErrorMessage } from '../../components/ui/Alert';
import { PageLoader } from '../../components/ui/Spinner';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

const TABS = [
  { key: 'profile', label: 'Profile & services' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'blocked', label: 'Blocked time & holidays' },
  { key: 'calendar', label: 'Calendar' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function DoctorEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const doctorId = isNew ? undefined : Number(id);
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabKey) || 'profile';
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const doctor = useAdminDoctor(doctorId);
  const schedule = useDoctorSchedule(doctorId);
  useDocumentTitle(isNew ? 'New doctor' : doctor.data?.fullName ?? 'Doctor');

  if (!isNew && doctor.isLoading) return <PageLoader />;
  if (!isNew && doctor.isError) return <ErrorMessage message={getErrorMessage(doctor.error)} onRetry={() => doctor.refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/doctors" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden />All doctors
        </Link>
        {doctor.data && (
          <a href={`/doctors/${doctor.data.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
            View public profile<ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </div>
      <h2 className="text-2xl font-semibold text-ink">{isNew ? 'Add a doctor' : doctor.data?.fullName}</h2>

      {!isNew && (
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
              onClick={() => setParams({ tab: t.key }, { replace: true })}
              className={cn('relative px-4 py-2.5 text-sm font-medium whitespace-nowrap', tab === t.key ? 'text-brand-800 dark:text-brand-300' : 'text-slate-500 hover:text-ink')}>
              {t.label}
              {tab === t.key && <motion.span layoutId="doctor-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>
      )}

      <Notice message={notice} onClear={() => setNotice(null)} />

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-7">
        {(isNew || tab === 'profile') && (
          <DoctorProfileForm
            doctor={doctor.data}
            onSaved={(saved, message) => {
              setNotice(message);
              if (isNew) navigate(`/admin/doctors/${saved.id}?tab=schedule`, { replace: true });
            }}
          />
        )}
        {!isNew && doctorId && tab === 'schedule' && <DoctorScheduleForm doctorId={doctorId} onSaved={setNotice} />}
        {!isNew && doctorId && tab === 'blocked' && (
          <BlockedTimeManager doctorId={doctorId} blocks={schedule.data?.upcomingBlocks ?? []} onMessage={setNotice} />
        )}
        {!isNew && doctorId && tab === 'calendar' && (
          <div className="space-y-10">
            <DoctorDayView doctorId={doctorId} />
            <div className="border-t border-slate-100 pt-8">
              <h3 className="mb-4 font-semibold text-ink">Week / month</h3>
              <CalendarView initialDoctorId={doctorId} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
