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
import { BadgePercent } from 'lucide-react';
import { useSite } from '../../hooks/usePublicData';
import { todayInZone } from '../../utils/dates';
import { formatRupees } from '../../utils/format';
import { offerRange } from '../../utils/offers';
import { cn } from '../../utils/cn';

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
    offerEnabled: !!s?.offer,
    offerDiscountPercent: s?.offer ? String(s.offer.percent) : '',
    offerStartDate: s?.offer?.startDate ?? '',
    offerEndDate: s?.offer?.endDate ?? '',
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
          offerDiscountPercent: v.offerEnabled ? Number(v.offerDiscountPercent) : null,
          offerStartDate: v.offerEnabled ? v.offerStartDate : null,
          offerEndDate: v.offerEnabled ? v.offerEndDate : null,
        },
      });
      onSaved(service ? 'Service updated' : 'Service created');
    } catch (err) {
      Object.entries(parseApiError(err).fieldErrors).forEach(([field, message]) => {
        if (field === 'offerDiscountPercent' || field === 'offerStartDate' || field === 'offerEndDate' || field in toForm(null)) {
          setError(field as keyof ServiceFormValues, { message });
        }
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {eligibleDoctors.map((d) => <Checkbox key={d.id} value={String(d.id)} label={`${d.fullName} · ${d.professionalTitle}`} {...register('doctorIds')} />)}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">Patients can only book this service with the doctors ticked here.</p>
        </fieldset>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Treatment fee (₹)" optional inputMode="decimal" placeholder="Empty = 'Discussed at consultation'" hint="Charged on top of the doctor's consultation fee" error={errors.consultationFee?.message} {...register('consultationFee')} />
          <Input label="Estimated duration (minutes)" required inputMode="numeric" hint="Appointments occupy this time, rounded up to whole slots" error={errors.estimatedDuration?.message} {...register('estimatedDuration')} />
          <Select label="Icon" {...register('icon')}>
            {Object.entries(SERVICE_ICONS).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          </Select>
          <Input label="URL slug" optional hint="Page address: /services/your-slug" error={errors.slug?.message} {...register('slug')} />
          <Input label="Display order" inputMode="numeric" hint="Lower numbers appear first" error={errors.displayOrder?.message} {...register('displayOrder')} />
        </div>
        <OfferFields register={register} errors={errors} values={watch()} />
        <ImageUpload label="Service image (optional)" value={watch('imageUrl')} onChange={(url) => setValue('imageUrl', url, { shouldDirty: true })} />
        <Checkbox label="Active (visible on the website and bookable)" {...register('active')} />
      </form>
    </Modal>
  );
}

type FormApi = ReturnType<typeof useForm<ServiceFormValues>>;

/** Time-limited percentage offer on the treatment fee, with a live preview of how it will look and when it runs. */
function OfferFields({ register, errors, values }: { register: FormApi['register']; errors: FormApi['formState']['errors']; values: ServiceFormValues }) {
  const { clinic } = useSite();
  const today = todayInZone(clinic.timezone);
  const enabled = values.offerEnabled;
  const pct = Number(values.offerDiscountPercent);
  const fee = Number(values.consultationFee);
  const valid = enabled && pct >= 1 && pct <= 100 && !!values.offerStartDate && !!values.offerEndDate && values.offerEndDate >= values.offerStartDate;
  const phase = !valid ? null : today < values.offerStartDate ? 'Scheduled' : today > values.offerEndDate ? 'Ended' : 'Running now';

  return (
    <fieldset className={cn('rounded-2xl border p-4 transition-colors', enabled ? 'border-amber-200 bg-amber-50/40 dark:border-amber-400/25 dark:bg-amber-400/5' : 'border-slate-200')}>
      <legend className="px-1 text-sm font-medium text-slate-700">Limited-time offer</legend>
      <Checkbox label="Give a percentage off this treatment for a set period" {...register('offerEnabled')} />
      {enabled && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Discount (%)" required inputMode="numeric" placeholder="e.g. 30" error={errors.offerDiscountPercent?.message} {...register('offerDiscountPercent')} />
            <Input label="Starts on" required type="date" error={errors.offerStartDate?.message} {...register('offerStartDate')} />
            <Input label="Ends on" required type="date" min={values.offerStartDate || today} error={errors.offerEndDate?.message} {...register('offerEndDate')} />
          </div>
          {valid && (
            <div className="flex items-center gap-3 rounded-xl bg-surface p-3 ring-1 ring-amber-200 dark:ring-amber-400/25">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><BadgePercent className="size-5" aria-hidden /></span>
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-ink">
                  {pct}% off {values.name || 'this treatment'} · {offerRange({ startDate: values.offerStartDate, endDate: values.offerEndDate })}
                </p>
                <p className="text-slate-500">
                  {fee > 0 ? <><s>{formatRupees(fee)}</s> {formatRupees(Math.round((fee * (100 - pct)) / 100))} · </> : null}
                  <span className={cn('font-medium', phase === 'Running now' ? 'text-emerald-600' : phase === 'Ended' ? 'text-red-600' : 'text-amber-700')}>{phase}</span>
                  {phase === 'Ended' ? '. Hidden on the website.' : '. Shown on the home page with a countdown.'}
                </p>
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Applies to appointments dated within these days (both included). Bookings already made keep the price they were given if you change or remove the offer.
          </p>
        </div>
      )}
    </fieldset>
  );
}
