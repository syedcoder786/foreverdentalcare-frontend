import { useState } from 'react';
import { Ban, Trash2 } from 'lucide-react';
import type { BlockView } from '../../../types';
import { useAddBlock, useDeleteBlock } from '../../../hooks/useAdminData';
import { formatDate, formatTime } from '../../../utils/format';
import { parseApiError } from '../../../utils/errors';
import { Input } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { EmptyState } from '../../ui/EmptyState';

interface Props {
  /** Omit for clinic-wide holidays (apply to every doctor). */
  doctorId?: number;
  blocks: BlockView[];
  onMessage: (message: string) => void;
}

/** Add / remove blocked dates and time ranges (holidays, leave, conferences). */
export function BlockedTimeManager({ doctorId, blocks, onMessage }: Props) {
  const add = useAddBlock();
  const remove = useDeleteBlock();
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [partial, setPartial] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const submit = async () => {
    try {
      const res = await add.mutateAsync({
        doctorId,
        payload: { date, endDate: endDate || undefined, startTime: partial ? startTime : undefined, endTime: partial ? endTime : undefined, reason: reason || undefined },
      });
      onMessage(res.message ?? 'Time blocked');
      setDate(''); setEndDate(''); setReason(''); setStartTime(''); setEndTime(''); setPartial(false);
    } catch { /* shown below */ }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-ink">{doctorId ? 'Block time for this doctor' : 'Add a clinic-wide holiday'}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {doctorId ? 'Patients will not be able to book this doctor during blocked time. Other doctors are unaffected.' : 'Closes every doctor’s calendar on these dates.'}
        </p>
        {add.isError && <Alert tone="error" className="mt-4">{parseApiError(add.error).message}</Alert>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Until (optional)" type="date" value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} hint="For multi-day leave" />
          <Input label="Reason" optional value={reason} onChange={(e) => setReason(e.target.value)} wrapperClassName="lg:col-span-2" hint="Shown to patients as the reason the date is unavailable" />
        </div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="size-4 accent-brand-700" checked={partial} onChange={(e) => setPartial(e.target.checked)} />
          Block only part of the day
        </label>
        {partial && (
          <div className="mt-3 grid max-w-md grid-cols-2 gap-4">
            <Input label="From" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input label="To" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button icon={<Ban className="size-4" aria-hidden />} loading={add.isPending} disabled={!date || (partial && (!startTime || !endTime))} onClick={submit}>
            Block time
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-ink">Upcoming blocked time</h3>
        {blocks.length === 0 ? (
          <EmptyState title="Nothing blocked" description="All upcoming working days are open for booking." />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">
                    {formatDate(b.date)} · {b.startTime ? `${formatTime(b.startTime)} - ${formatTime(b.endTime)}` : 'Full day'}
                    {b.clinicWide && doctorId && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Clinic holiday</span>}
                  </p>
                  {b.reason && <p className="text-xs text-slate-500">{b.reason}</p>}
                </div>
                {(!b.clinicWide || !doctorId) && (
                  <Button size="sm" variant="ghostDanger" aria-label="Remove blocked time" icon={<Trash2 className="size-4" />} loading={remove.isPending && remove.variables?.blockId === b.id}
                    onClick={async () => onMessage(await remove.mutateAsync({ doctorId: b.clinicWide ? undefined : doctorId, blockId: b.id }))} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
