import { useEffect, useState } from 'react';
import type { AdminDoctor } from '../../types';
import { useAdminDoctors, useCreateAppointment } from '../../hooks/useAdminData';
import { useSite } from '../../hooks/usePublicData';
import { todayInZone } from '../../utils/dates';
import { parseApiError } from '../../utils/errors';
import { Modal } from '../ui/Modal';
import { Input, Select, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { SlotPicker } from '../appointment/SlotPicker';

/** Manual appointment entry by staff (e.g. phone bookings). Uses the same per-doctor availability as the website. */
export function NewAppointmentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (message: string) => void }) {
  const { clinic } = useSite();
  const doctors = useAdminDoctors();
  const create = useCreateAppointment();
  const today = todayInZone(clinic.timezone);
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED'>('CONFIRMED');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      create.reset();
      setErrors({});
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const doctor: AdminDoctor | undefined = doctors.data?.find((d) => String(d.id) === doctorId);

  const submit = async () => {
    setErrors({});
    try {
      await create.mutateAsync({
        doctorId: Number(doctorId), serviceId: Number(serviceId), appointmentDate: date, appointmentTime: time,
        fullName, phone, email: email || undefined, message: message || undefined, initialStatus: status,
      });
      onCreated('Appointment created');
      setTime(''); setFullName(''); setPhone(''); setEmail(''); setMessage('');
    } catch (err) {
      setErrors(parseApiError(err).fieldErrors);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New appointment" description="Book on behalf of a patient. Only the doctor's free slots are offered." size="lg"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={create.isPending} disabled={!doctorId || !serviceId || !date || !time || !fullName || !phone} onClick={submit}>Create appointment</Button>
      </>}>
      <div className="space-y-5">
        {create.isError && <Alert tone="error">{parseApiError(create.error).message}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Doctor" required value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setServiceId(''); setTime(''); }} error={errors.doctorId}>
            <option value="">Select a doctor</option>
            {doctors.data?.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{d.fullName} · {d.professionalTitle}</option>)}
          </Select>
          <Select label="Service" required value={serviceId} disabled={!doctor} onChange={(e) => { setServiceId(e.target.value); setTime(''); }} error={errors.serviceId}>
            <option value="">{doctor ? 'Select a service' : 'Choose a doctor first'}</option>
            {doctor?.services.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.estimatedDuration} min)</option>)}
          </Select>
          <Input label="Date" type="date" required min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} error={errors.appointmentDate} />
          <Select label="Initial status" value={status} onChange={(e) => setStatus(e.target.value as 'PENDING' | 'CONFIRMED')}>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
          </Select>
        </div>
        <SlotPicker doctorId={doctor?.id} serviceId={serviceId ? Number(serviceId) : undefined} date={date && date >= today ? date : undefined} value={time} onChange={setTime} error={errors.appointmentTime} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Patient name" required value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
          <Input label="Phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
          <Input label="Email" optional type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} wrapperClassName="sm:col-span-2" />
        </div>
        <Textarea label="Notes" optional rows={2} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
    </Modal>
  );
}
