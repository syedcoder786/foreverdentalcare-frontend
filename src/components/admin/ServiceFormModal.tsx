import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { DentalService } from '../../types';
import { serviceSchema, type ServiceFormValues } from '../../utils/validation';
import { parseApiError } from '../../utils/errors';
import { useAdminDoctors, useAdminSpecialties, useSaveService } from '../../hooks/useAdminData';
import { Modal } from '../ui/Modal';
import { Checkbox, Input, Select, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { SERVICE_ICONS } from '../services/ServiceIcon';
import { ImageUpload } from './ImageUpload';

interface Props {
  open: boolean;
  service: DentalService | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

function toForm(s: DentalService | null): ServiceFormValues {
  return {
    name: s?.name ?? '',
    slug: s?.slug ?? '',
    specialtyId: s ? String(s.specialty.id) : '',
    doctorIds: s?.doctors.map((d) => String(d.id)) ?? [],
    imageUrl: s?.imageUrl ?? '',
    description: s?.description ?? '',
    detailsText: s?.details.join('\n') ?? '',
    icon: s?.icon ?? 'stethoscope',
    consultationFee: s?.consultationFee != null ? String(s.consultationFee) : '',
    estimatedDuration: String(s?.estimatedDuration ?? 30),
    displayOrder: String(s?.displayOrder ?? 0),
    active: s?.active ?? true,
  };
}

/** Create/edit a treatment: its specialty, the doctors allowed to perform it, fee, duration and image. */
export function ServiceFormModal({ open, service, onClose, onSaved }: Props) {
  const mutation = useSaveService();
  const specialties = useAdminSpecialties();
  const doctors = useAdminDoctors();
  const { register, handleSubmit, reset, setError, watch, setValue, formState: { errors } } =
    useForm<ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues: toForm(service) });

  useEffect(() => {
    if (open) {
      reset(toForm(service));
      mutation.reset();
    }
  }, [open, service]); // eslint-disable-line react-hooks/exhaustive-deps

  const specialtyId = watch('specialtyId');
  // A doctor may only perform services within their own specialties.
  const eligibleDoctors = (doctors.data ?? []).filter((d) => d.specialties.some((s) => String(s.id) === specialtyId));

  const onSubmit = handleSubmit(async (v) => {
    try {
      await mutation.mutateAsync({
        id: service?.id,
        payload: {
          name: v.name.trim(),
          slug: v.slug?.trim() || undefined,
          specialtyId: Number(v.specialtyId),
          doctorIds: v.doctorIds.filter((id) => eligibleDoctors.some((d) => String(d.id) === id)).map(Number),
          imageUrl: v.imageUrl || undefined,
          description: v.description.trim(),
          details: (v.detailsText ?? '').split('\n').map((l) => l.trim()).filter(Boolean),
          icon: v.icon || undefined,
          consultationFee: v.consultationFee ? Number(v.consultationFee) : null,
          estimatedDuration: Number(v.estimatedDuration),
          displayOrder: Number(v.displayOrder),
          active: v.active,
        },
      });
      onSaved(service ? 'Service updated' : 'Service created');
    } catch (err) {
      Object.entries(parseApiError(err).fieldErrors).forEach(([field, message]) => {
        if (field in toForm(null)) setError(field as keyof ServiceFormValues, { message });
      });
    }
  });

  return (
    <Modal open={open} onClose={onClose} title={service ? 'Edit service' : 'Add service'} description="Shown on the public website and in the booking form." size="lg"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="service-form" loading={mutation.isPending}>{service ? 'Save changes' : 'Create service'}</Button>
      </>}>
      <form id="service-form" onSubmit={onSubmit} noValidate className="space-y-5">
        {mutation.isError && <Alert tone="error">{parseApiError(mutation.error).message}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Name" required error={errors.name?.message} {...register('name')} />
          <Select label="Specialty" required error={errors.specialtyId?.message} {...register('specialtyId')}>
            <option value="">Select a specialty</option>
            {specialties.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <Textarea label="Description" required rows={3} error={errors.description?.message} {...register('description')} />
        <Textarea label="Key points" optional rows={4} hint="One point per line. Avoid guarantees or medical claims." error={errors.detailsText?.message} {...register('detailsText')} />

        <fieldset className="rounded-2xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Doctors who perform this service</legend>
          {!specialtyId ? (
            <p className="text-sm text-slate-500">Choose a specialty first.</p>
          ) : eligibleDoctors.length === 0 ? (
            <p className="text-sm text-slate-500">No doctor has this specialty yet. Add it to a doctor&apos;s profile first.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {eligibleDoctors.map((d) => <Checkbox key={d.id} value={String(d.id)} label={`${d.fullName} · ${d.professionalTitle}`} {...register('doctorIds')} />)}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">Patients can only book this service with the doctors ticked here.</p>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Consultation fee" optional inputMode="decimal" placeholder="Empty = 'Discussed at consultation'" error={errors.consultationFee?.message} {...register('consultationFee')} />
          <Input label="Estimated duration (minutes)" required inputMode="numeric" hint="Appointments occupy this time, rounded up to whole slots" error={errors.estimatedDuration?.message} {...register('estimatedDuration')} />
          <Select label="Icon" {...register('icon')}>
            {Object.entries(SERVICE_ICONS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          </Select>
          <Input label="URL slug" optional hint="Page address: /services/your-slug" error={errors.slug?.message} {...register('slug')} />
          <Input label="Display order" inputMode="numeric" hint="Lower numbers appear first" error={errors.displayOrder?.message} {...register('displayOrder')} />
        </div>
        <ImageUpload label="Service image (optional)" value={watch('imageUrl')} onChange={(url) => setValue('imageUrl', url, { shouldDirty: true })} />
        <Checkbox label="Active (visible on the website and bookable)" {...register('active')} />
      </form>
    </Modal>
  );
}
