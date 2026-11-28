import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, ShieldAlert, Trash2 } from 'lucide-react';
import type { AdminDoctor, DoctorPayload, Gender } from '../../../types';
import { useAdminServices, useAdminSpecialties, useSaveDoctor } from '../../../hooks/useAdminData';
import { parseApiError } from '../../../utils/errors';
import { Checkbox, Input, Select, Textarea } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { ImageUpload } from '../ImageUpload';

interface FormValues {
  fullName: string;
  slug: string;
  professionalTitle: string;
  gender: Gender;
  profileImageUrl: string;
  shortBio: string;
  biography: string;
  qualifications: { degree: string; institution: string; year: string }[];
  registrationNumber: string;
  registrationAuthority: string;
  credentialsVerified: boolean;
  experienceYears: string;
  consultationFee: string;
  displayOrder: string;
  active: boolean;
  featured: boolean;
  specialtyIds: string[];
  serviceIds: string[];
}

function toForm(d?: AdminDoctor): FormValues {
  return {
    fullName: d?.fullName ?? '',
    slug: d?.slug ?? '',
    professionalTitle: d?.professionalTitle ?? '',
    gender: d?.gender ?? 'UNSPECIFIED',
    profileImageUrl: d?.profileImageUrl ?? '',
    shortBio: d?.shortBio ?? '',
    biography: d?.biography ?? '',
    qualifications: d?.qualifications.map((q) => ({ degree: q.degree, institution: q.institution ?? '', year: q.year ?? '' })) ?? [],
    registrationNumber: d?.registrationNumber ?? '',
    registrationAuthority: d?.registrationAuthority ?? '',
    credentialsVerified: d?.credentialsVerified ?? false,
    experienceYears: d?.experienceYears != null ? String(d.experienceYears) : '',
    consultationFee: d?.consultationFee != null ? String(d.consultationFee) : '',
    displayOrder: String(d?.displayOrder ?? 0),
    active: d?.active ?? true,
    featured: d?.featured ?? true,
    specialtyIds: d?.specialties.map((s) => String(s.id)) ?? [],
    serviceIds: d?.services.map((s) => String(s.id)) ?? [],
  };
}

export function DoctorProfileForm({ doctor, onSaved }: { doctor?: AdminDoctor; onSaved: (d: AdminDoctor, message: string) => void }) {
  const save = useSaveDoctor();
  const specialties = useAdminSpecialties();
  const services = useAdminServices();
  const { register, handleSubmit, reset, watch, setValue, setError, control, formState: { errors } } = useForm<FormValues>({ defaultValues: toForm(doctor) });
  const quals = useFieldArray({ control, name: 'qualifications' });

  useEffect(() => reset(toForm(doctor)), [doctor, reset]);

  const selectedSpecialties = watch('specialtyIds');
  const selectedServices = watch('serviceIds');
  const verified = watch('credentialsVerified');
  const photo = watch('profileImageUrl');

  // Only services from the doctor's specialties can be assigned (enforced again by the backend).
  const availableServices = useMemo(
    () => (services.data ?? []).filter((s) => selectedSpecialties.includes(String(s.specialty.id))),
    [services.data, selectedSpecialties],
  );
  useEffect(() => {
    const allowed = new Set(availableServices.map((s) => String(s.id)));
    const kept = selectedServices.filter((id) => allowed.has(id));
    if (kept.length !== selectedServices.length && services.data) setValue('serviceIds', kept);
  }, [availableServices]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = handleSubmit(async (v) => {
    const payload: DoctorPayload = {
      fullName: v.fullName.trim(),
      slug: v.slug.trim() || undefined,
      professionalTitle: v.professionalTitle.trim(),
      gender: v.gender,
      profileImageUrl: v.profileImageUrl || undefined,
      shortBio: v.shortBio,
      biography: v.biography,
      qualifications: v.qualifications.filter((q) => q.degree.trim()).map((q) => ({ degree: q.degree.trim(), institution: q.institution, year: q.year })),
      registrationNumber: v.registrationNumber,
      registrationAuthority: v.registrationAuthority,
      credentialsVerified: v.credentialsVerified,
      experienceYears: v.experienceYears ? Number(v.experienceYears) : null,
      consultationFee: v.consultationFee ? Number(v.consultationFee) : null,
      displayOrder: Number(v.displayOrder || 0),
      active: v.active,
      featured: v.featured,
      specialtyIds: v.specialtyIds.map(Number),
      serviceIds: v.serviceIds.map(Number),
    };
    try {
      const saved = await save.mutateAsync({ id: doctor?.id, payload });
      onSaved(saved, doctor ? 'Doctor profile saved' : 'Doctor created. Now set up their schedule.');
    } catch (err) {
      Object.entries(parseApiError(err).fieldErrors).forEach(([f, m]) => setError(f as keyof FormValues, { message: m }));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ImageUpload label="Profile photo" aspect="portrait" value={photo} onChange={(url) => setValue('profileImageUrl', url, { shouldDirty: true })} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-2">
          <Input label="Full name" required error={errors.fullName?.message} {...register('fullName', { required: 'Full name is required' })} />
          <Input label="Professional title" required placeholder="e.g. Dentist (BDS) or Unani Physician (BUMS)" error={errors.professionalTitle?.message} {...register('professionalTitle', { required: 'Title is required' })} />
          <Select label="Gender (shown on profile)" {...register('gender')}>
            <option value="UNSPECIFIED">Not shown</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </Select>
          <Input label="URL slug" optional hint={`Profile address: /doctors/${watch('slug') || 'auto-generated'}`} error={errors.slug?.message} {...register('slug')} />
          <Input label="Years of experience" optional inputMode="numeric" error={errors.experienceYears?.message} {...register('experienceYears')} />
          <Input label="Default consultation fee" optional inputMode="decimal" hint="Used when a treatment has no fee of its own" error={errors.consultationFee?.message} {...register('consultationFee')} />
          <Textarea label="Short bio" optional rows={2} wrapperClassName="sm:col-span-2" hint="Shown on doctor cards (max 500 characters)" error={errors.shortBio?.message} {...register('shortBio')} />
        </div>
      </section>

      <Textarea label="Professional biography" optional rows={6} hint="Blank lines separate paragraphs. Avoid guarantees or unverifiable claims." error={errors.biography?.message} {...register('biography')} />

      <section className="space-y-4 rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink">Qualifications & registration</h3>
          <Button size="sm" variant="outline" icon={<Plus className="size-4" aria-hidden />} onClick={() => quals.append({ degree: '', institution: '', year: '' })}>Add qualification</Button>
        </div>
        {quals.fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_2fr_1fr_auto] sm:items-end">
            <Input label="Degree" placeholder="e.g. BUMS - Bachelor of Unani Medicine and Surgery" {...register(`qualifications.${i}.degree`)} />
            <Input label="Institution" {...register(`qualifications.${i}.institution`)} />
            <Input label="Year" {...register(`qualifications.${i}.year`)} />
            <Button variant="ghostDanger" size="sm" className="h-11" aria-label="Remove qualification" icon={<Trash2 className="size-4" />} onClick={() => quals.remove(i)} />
          </div>
        ))}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Registration number" optional {...register('registrationNumber')} />
          <Input label="Registration authority" optional placeholder="e.g. State Dental Council / State Board of Unani Medicine" {...register('registrationAuthority')} />
        </div>
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <p className="flex items-center gap-2 font-semibold"><ShieldAlert className="size-4" aria-hidden />Publishing credentials</p>
          <p className="mt-1">Qualifications and registration details are shown on the website only after you confirm below that you have checked them against the original certificates and the official register.</p>
          <Checkbox className="mt-3" label="I have verified these qualifications and registration details" {...register('credentialsVerified')} />
          {!verified && <p className="mt-2 text-xs">Currently hidden from the public profile.</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <fieldset className="rounded-2xl border border-slate-200 p-5">
          <legend className="px-1 font-semibold text-ink">Specialties</legend>
          <div className="mt-2 space-y-2">
            {specialties.data?.map((s) => (
              <Checkbox key={s.id} value={String(s.id)} label={`${s.name}${s.active ? '' : ' (inactive)'}`} {...register('specialtyIds')} />
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-slate-200 p-5">
          <legend className="px-1 font-semibold text-ink">Services this doctor performs</legend>
          <p className="mb-3 text-xs text-slate-500">Only services within the selected specialties can be assigned. The doctor only receives bookings for these.</p>
          {availableServices.length === 0 ? (
            <p className="text-sm text-slate-500">Select a specialty first.</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {availableServices.map((s) => (
                <Checkbox key={s.id} value={String(s.id)} label={`${s.name} · ${s.specialty.name}${s.active ? '' : ' (inactive)'}`} {...register('serviceIds')} />
              ))}
            </div>
          )}
          {errors.serviceIds && <p role="alert" className="mt-2 text-sm text-red-600">{errors.serviceIds.message}</p>}
        </fieldset>
      </section>

      <section className="flex flex-wrap items-center gap-6">
        <Checkbox label="Active (visible and bookable)" {...register('active')} />
        <Checkbox label="Featured on the home page" {...register('featured')} />
        <Input label="Display order" inputMode="numeric" wrapperClassName="w-32" {...register('displayOrder')} />
      </section>

      {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button type="submit" loading={save.isPending}>{doctor ? 'Save profile' : 'Create doctor'}</Button>
      </div>
    </form>
  );
}
