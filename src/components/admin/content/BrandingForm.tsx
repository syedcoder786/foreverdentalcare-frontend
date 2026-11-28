import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ClinicSettings } from '../../../types';
import { useAdminSettings, useSaveSettings } from '../../../hooks/useAdminData';
import { getErrorMessage, parseApiError } from '../../../utils/errors';
import { Input, Textarea } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert, ErrorMessage } from '../../ui/Alert';
import { Skeleton } from '../../ui/Spinner';
import { ImageUpload } from '../ImageUpload';
import { toast } from '../../ui/Toast';

type BrandingFields = Pick<ClinicSettings, 'clinicName' | 'logoUrl' | 'tagline' | 'headerCtaText' | 'whatsappNumber' | 'footerDescription' | 'copyrightText' | 'facebookUrl' | 'instagramUrl' | 'youtubeUrl' | 'googleReviewsUrl'>;

/** Header & footer: logo, name, tagline, header button, WhatsApp, footer text and social links. */
export function BrandingForm() {
  const { data, isLoading, isError, error, refetch } = useAdminSettings();
  const save = useSaveSettings();
  const [form, setForm] = useState<BrandingFields | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (data) setForm({ clinicName: data.clinicName, logoUrl: data.logoUrl ?? '', tagline: data.tagline ?? '', headerCtaText: data.headerCtaText ?? '', whatsappNumber: data.whatsappNumber ?? '',
      footerDescription: data.footerDescription ?? '', copyrightText: data.copyrightText ?? '', facebookUrl: data.facebookUrl ?? '', instagramUrl: data.instagramUrl ?? '',
      youtubeUrl: data.youtubeUrl ?? '', googleReviewsUrl: data.googleReviewsUrl ?? '' });
  }, [data]);

  if (isLoading || !form) return isError ? <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} /> : <Skeleton className="h-64" />;
  const set = (k: keyof BrandingFields, v: string) => { setForm((f) => (f ? { ...f, [k]: v } : f)); setSaved(false); };
  const errors = save.isError ? parseApiError(save.error).fieldErrors : {};

  const submit = async () => {
    if (!data) return;
    const { timezone, ...rest } = data;
    void timezone; // read-only, not part of the update payload
    try {
      await save.mutateAsync({ ...rest, ...form });
      setSaved(true);
      toast.success('Header & footer saved.');
    } catch { /* shown below */ }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ImageUpload label="Clinic logo" aspect="square" hint="Square image works best. Leave empty to use the default mark." value={form.logoUrl} onChange={(url) => set('logoUrl', url)} error={errors.logoUrl} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          <Input label="Clinic name" required value={form.clinicName} onChange={(e) => set('clinicName', e.target.value)} error={errors.clinicName} />
          <Input label="Tagline (under the name)" value={form.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} />
          <Input label="Header button text" placeholder="Book appointment" value={form.headerCtaText ?? ''} onChange={(e) => set('headerCtaText', e.target.value)} />
          <Input label="WhatsApp number" type="tel" value={form.whatsappNumber ?? ''} onChange={(e) => set('whatsappNumber', e.target.value)} error={errors.whatsappNumber} />
        </div>
      </div>
      <Textarea label="Footer description" rows={2} value={form.footerDescription ?? ''} onChange={(e) => set('footerDescription', e.target.value)} />
      <Input label="Copyright text" hint="Shown after '© year Clinic name.'" value={form.copyrightText ?? ''} onChange={(e) => set('copyrightText', e.target.value)} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Instagram URL" placeholder="https://instagram.com/..." value={form.instagramUrl ?? ''} onChange={(e) => set('instagramUrl', e.target.value)} error={errors.instagramUrl} />
        <Input label="Facebook URL" value={form.facebookUrl ?? ''} onChange={(e) => set('facebookUrl', e.target.value)} error={errors.facebookUrl} />
        <Input label="YouTube URL" value={form.youtubeUrl ?? ''} onChange={(e) => set('youtubeUrl', e.target.value)} error={errors.youtubeUrl} />
        <Input label="Google reviews URL" value={form.googleReviewsUrl ?? ''} onChange={(e) => set('googleReviewsUrl', e.target.value)} error={errors.googleReviewsUrl} />
      </div>
      <p className="text-xs text-slate-500">
        Address, phone, email, map and opening hours are edited in <Link to="/admin/settings" className="font-semibold text-brand-700 hover:underline">Clinic settings</Link> and used in the header, footer and contact page.
      </p>
      {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
      {saved && <Alert tone="success">Header & footer saved.</Alert>}
      <div className="flex justify-end"><Button loading={save.isPending} onClick={submit}>Save header & footer</Button></div>
    </div>
  );
}
