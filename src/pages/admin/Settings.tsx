import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgePercent, Save } from 'lucide-react';
import type { ClinicSettings, DayOfWeek } from '../../types';
import { useAdminDoctors, useAdminSettings, useHolidays, useSaveSettings } from '../../hooks/useAdminData';
import { Link } from 'react-router-dom';
import { BlockedTimeManager } from '../../components/admin/doctor/BlockedTimeManager';
import { Notice } from '../../components/admin/Notice';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { settingsSchema, type SettingsFormValues } from '../../utils/validation';
import { parseApiError } from '../../utils/errors';
import { DAYS_ORDER, DAY_LABELS, formatRupees, formatTime } from '../../utils/format';
import { Input, Textarea } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { PageLoader } from '../../components/ui/Spinner';
import { cn } from '../../utils/cn';

function toForm(s: ClinicSettings): SettingsFormValues {
  return {
    clinicName: s.clinicName,
    address: s.address,
    phone: s.phone,
    whatsappNumber: s.whatsappNumber ?? '',
    email: s.email ?? '',
    mapEmbedUrl: s.mapEmbedUrl ?? '',
    mapLinkUrl: s.mapLinkUrl ?? '',
    openingTime: s.openingTime,
    closingTime: s.closingTime,
    breakStartTime: s.breakStartTime ?? '',
    breakEndTime: s.breakEndTime ?? '',
    workingDays: s.workingDays,
    slotDurationMinutes: String(s.slotDurationMinutes),
    bookingWindowDays: String(s.bookingWindowDays),
    firstVisitDiscountPercent: s.firstVisitDiscountPercent != null ? String(s.firstVisitDiscountPercent) : '',
    firstVisitOfferEnabled: !!s.firstVisitOfferEnabled,
  };
}

/** Mirrors the backend slot generation so the admin can preview the result before saving. */
function previewSlots(v: Partial<SettingsFormValues>): string[] {
  const toMin = (t?: string) => (t && /^\d{2}:\d{2}$/.test(t) ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) : NaN);
  const open = toMin(v.openingTime);
  const close = toMin(v.closingTime);
  const step = Number(v.slotDurationMinutes);
  const bs = toMin(v.breakStartTime);
  const be = toMin(v.breakEndTime);
  if (!Number.isFinite(open) || !Number.isFinite(close) || !step || step < 5 || close <= open) return [];
  const slots: string[] = [];
  for (let s = open; s + step <= close && slots.length < 200; s += step) {
    const overlaps = Number.isFinite(bs) && Number.isFinite(be) && s < be && s + step > bs;
    if (!overlaps) slots.push(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
  }
  return slots;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-6 border-b border-slate-100 py-8 last:border-0 lg:grid-cols-3">
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="space-y-5 lg:col-span-2">{children}</div>
    </section>
  );
}

export default function Settings() {
  useDocumentTitle('Clinic settings');
  const { data, isLoading, isError, error, refetch } = useAdminSettings();
  const mutation = useSaveSettings();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (data) reset(toForm(data));
  }, [data, reset]);

  const values = watch();
  const slots = previewSlots(values);
  const workingDays = (values.workingDays ?? []) as DayOfWeek[];

  const toggleDay = (day: DayOfWeek) => {
    const next = workingDays.includes(day) ? workingDays.filter((d) => d !== day) : [...workingDays, day];
    setValue('workingDays', DAYS_ORDER.filter((d) => next.includes(d)), { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (v) => {
    setSaved(false);
    try {
      await mutation.mutateAsync({
        // Header/footer fields are edited in Website content -> Header & footer; keep their current values.
        logoUrl: data?.logoUrl, tagline: data?.tagline, headerCtaText: data?.headerCtaText,
        footerDescription: data?.footerDescription, copyrightText: data?.copyrightText,
        facebookUrl: data?.facebookUrl, instagramUrl: data?.instagramUrl, youtubeUrl: data?.youtubeUrl,
        googleReviewsUrl: data?.googleReviewsUrl,
        clinicName: v.clinicName.trim(),
        address: v.address.trim(),
        phone: v.phone.trim(),
        whatsappNumber: v.whatsappNumber.trim(),
        email: v.email.trim(),
        mapEmbedUrl: v.mapEmbedUrl.trim(),
        mapLinkUrl: v.mapLinkUrl.trim(),
        openingTime: v.openingTime,
        closingTime: v.closingTime,
        breakStartTime: v.breakStartTime || undefined,
        breakEndTime: v.breakEndTime || undefined,
        workingDays: v.workingDays as DayOfWeek[],
        slotDurationMinutes: Number(v.slotDurationMinutes),
        bookingWindowDays: Number(v.bookingWindowDays),
        firstVisitDiscountPercent: v.firstVisitDiscountPercent === '' ? null : Number(v.firstVisitDiscountPercent),
        firstVisitOfferEnabled: v.firstVisitOfferEnabled,
      });
      setSaved(true);
    } catch (err) {
      const parsed = parseApiError(err);
      Object.entries(parsed.fieldErrors).forEach(([field, message]) => setError(field as keyof SettingsFormValues, { message }));
    }
  });

  if (isLoading) return <PageLoader label="Loading settings..." />;
  if (isError) return <ErrorMessage message={parseApiError(error).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-slate-200 bg-surface px-5 shadow-soft sm:px-8">
      {(saved || mutation.isError) && (
        <div className="pt-6">
          {saved && <Alert tone="success">Settings saved. The website and booking slots now use the new values.</Alert>}
          {mutation.isError && <Alert tone="error">{parseApiError(mutation.error).message}</Alert>}
        </div>
      )}

      <Section title="Clinic information" description="Shown in the website header, footer and contact page.">
        <Input label="Clinic name" required error={errors.clinicName?.message} {...register('clinicName')} />
        <Textarea label="Address" required rows={2} error={errors.address?.message} {...register('address')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Contact number" required type="tel" error={errors.phone?.message} {...register('phone')} />
          <Input label="WhatsApp number" optional type="tel" error={errors.whatsappNumber?.message} {...register('whatsappNumber')} />
        </div>
        <Input label="Email" optional type="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Google Maps embed URL"
          optional
          placeholder="https://www.google.com/maps/embed?pb=..."
          hint="Google Maps -> Share -> Embed a map -> Copy HTML. Paste the whole <iframe> code or just its src URL."
          error={errors.mapEmbedUrl?.message}
          {...register('mapEmbedUrl')}
        />
        <Input
          label="Google Maps link (for Get directions)"
          optional
          placeholder="https://www.google.com/maps/dir/?api=1&destination=..."
          hint="Use a directions link so Get directions opens route planning: https://www.google.com/maps/dir/?api=1&destination= followed by the clinic's plus code or address. Don't use short goo.gl links."
          error={errors.mapLinkUrl?.message}
          {...register('mapLinkUrl')}
        />
      </Section>

      <Section title="Clinic opening hours" description="Shown on the website. Each doctor's bookable hours are set in Doctors -> Schedule.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Opening time" type="time" required error={errors.openingTime?.message} {...register('openingTime')} />
          <Input label="Closing time" type="time" required error={errors.closingTime?.message} {...register('closingTime')} />
          <Input label="Break start" type="time" optional error={errors.breakStartTime?.message} {...register('breakStartTime')} />
          <Input label="Break end" type="time" optional error={errors.breakEndTime?.message} {...register('breakEndTime')} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Working days</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS_ORDER.map((d) => {
              const active = workingDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleDay(d)}
                  className={cn(
                    'h-10 min-w-14 rounded-xl border px-3 text-sm font-medium transition',
                    active ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-surface text-slate-600 hover:border-brand-300',
                  )}
                >
                  {DAY_LABELS[d].short}
                </button>
              );
            })}
          </div>
          {errors.workingDays?.message && <p className="mt-2 text-sm text-red-600">{errors.workingDays.message}</p>}
        </fieldset>
      </Section>

      <Section title="Booking rules" description="Booking window applies to every doctor. Slot duration is the default for newly added doctors.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="Default slot duration for new doctors (minutes)" required inputMode="numeric" error={errors.slotDurationMinutes?.message} {...register('slotDurationMinutes')} />
          <Input label="Booking window (days ahead)" required inputMode="numeric" error={errors.bookingWindowDays?.message} {...register('bookingWindowDays')} />
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-ink">
            Preview with clinic hours: {slots.length} slot{slots.length === 1 ? '' : 's'} per working day
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {slots.map((s) => (
              <span key={s} className="rounded-lg bg-surface px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                {formatTime(s)}
              </span>
            ))}
          </div>
        </div>
      </Section>

      <Section
        title="First-visit online offer"
        description="A percentage off the consultation fee when a patient books their first appointment online. Fees come from each treatment, or the doctor's default fee (Doctors -> Profile). The website shows it until their first appointment is confirmed, and shows it again if that appointment is cancelled."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="First-visit discount (%)" optional inputMode="numeric" placeholder="e.g. 50" error={errors.firstVisitDiscountPercent?.message} {...register('firstVisitDiscountPercent')} />
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
          <input type="checkbox" className="mt-0.5 size-4 accent-brand-700" {...register('firstVisitOfferEnabled')} />
          <span className="text-sm">
            <span className="font-medium text-ink">Show the first-visit offer on the website</span>
            <span className="block text-slate-500">Home page banner and ribbon, booking page, navigation badge and a small floating pill.</span>
          </span>
        </label>
        <OfferPreview percent={values.firstVisitDiscountPercent} enabled={values.firstVisitOfferEnabled} />
        <DoctorsWithoutFee />
      </Section>

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-slate-100 bg-surface/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <Button variant="ghost" disabled={!isDirty || mutation.isPending} onClick={() => data && reset(toForm(data))}>
          Discard changes
        </Button>
        <Button type="submit" loading={mutation.isPending} icon={<Save className="size-4" aria-hidden />}>
          Save settings
        </Button>
      </div>
    </form>
      <ClinicHolidays />
    </div>
  );
}

/** Clinic-wide holidays block every doctor's calendar. */
/** The discount is a percentage of the fee, so doctors without one can't offer it. */
function DoctorsWithoutFee() {
  const { data = [] } = useAdminDoctors();
  const active = data.filter((d) => d.active);
  const missing = active.filter((d) => d.consultationFee == null || d.consultationFee <= 0);
  if (missing.length === 0) return null;
  const none = missing.length === active.length;
  return (
    <Alert tone="warning">
      <p className="font-medium">
        {none
          ? 'No doctor has a consultation fee yet, so the offer is hidden on the website.'
          : 'The discount is a percentage of the consultation fee, so it does not apply to these doctors:'}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {missing.map((d) => (
          <li key={d.id}>
            <Link to={`/admin/doctors/${d.id}`} className="font-medium underline">{d.fullName}</Link>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs">Add a "Default consultation fee" in Doctors -&gt; Profile &amp; services.</p>
    </Alert>
  );
}

function OfferPreview({ percent, enabled }: { percent?: string; enabled?: boolean }) {
  const p = Number(percent);
  if (!p || p < 1 || p > 100) {
    return <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Enter a discount to preview the offer.</p>;
  }
  const examples = [300, 500, 1000];
  return (
    <div className={cn('flex items-center gap-4 rounded-2xl bg-slate-50 p-4', !enabled && 'opacity-60')}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <BadgePercent className="size-6" aria-hidden />
      </span>
      <div className="text-sm">
        <p className="font-semibold text-ink">{p}% off the first consultation booked online</p>
        <p className="text-slate-500">
          For example{' '}
          {examples.map((f, i) => {
            const price = Math.round((f * (100 - p)) / 100);
            return (
              <span key={f}>
                <s className="text-slate-400">{formatRupees(f)}</s> {price === 0 ? 'Free' : formatRupees(price)}
                {i < examples.length - 1 ? ', ' : '. '}
              </span>
            );
          })}
          {enabled ? 'Visible on the website after you save.' : 'Hidden. Tick the box above to show it.'}
        </p>
      </div>
    </div>
  );
}

function ClinicHolidays() {
  const holidays = useHolidays();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-8">
      <h2 className="font-semibold text-ink">Clinic holidays</h2>
      <p className="mt-1 mb-5 text-sm text-slate-500">For leave of a single doctor, use Doctors &rarr; Blocked time instead.</p>
      <div className="mb-4"><Notice message={message} onClear={() => setMessage(null)} /></div>
      <BlockedTimeManager blocks={holidays.data ?? []} onMessage={setMessage} />
    </section>
  );
}
