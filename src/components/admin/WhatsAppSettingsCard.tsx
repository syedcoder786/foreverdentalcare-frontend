import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence } from 'motion/react';
import { CheckCircle2, CircleDashed, KeyRound, Save, Send } from 'lucide-react';
import type { WhatsAppSettingsPayload } from '../../types';
import { useSaveWhatsAppSettings, useSendWhatsAppTest, useWhatsAppSettings } from '../../hooks/useAdminData';
import { parseApiError, getErrorMessage } from '../../utils/errors';
import { Checkbox, Input } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Alert, ErrorMessage } from '../ui/Alert';
import { Skeleton } from '../ui/Spinner';
import { WhatsAppIcon } from '../layout/WhatsAppButton';
import { cn } from '../../utils/cn';

const EMPTY: WhatsAppSettingsPayload = {
  enabled: false,
  phoneNumberId: '',
  businessAccountId: '',
  accessToken: '',
  otpTemplateName: '',
  otpTemplateLanguage: 'en_US',
  defaultCountryCode: '91',
};

/** WhatsApp Cloud API credentials used to send patient sign-in codes. The access token is write-only. */
export function WhatsAppSettingsCard() {
  const query = useWhatsAppSettings();
  const save = useSaveWhatsAppSettings();
  const test = useSendWhatsAppTest();
  const [form, setForm] = useState<WhatsAppSettingsPayload>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ tone: 'success' | 'warning' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const d = query.data;
    if (!d) return;
    setForm({
      enabled: d.enabled,
      phoneNumberId: d.phoneNumberId ?? '',
      businessAccountId: d.businessAccountId ?? '',
      accessToken: '',
      otpTemplateName: d.otpTemplateName ?? '',
      otpTemplateLanguage: d.otpTemplateLanguage || 'en_US',
      defaultCountryCode: d.defaultCountryCode || '91',
    });
  }, [query.data]);

  const set = <K extends keyof WhatsAppSettingsPayload>(key: K, value: WhatsAppSettingsPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    try {
      await save.mutateAsync({ ...form, accessToken: form.accessToken.trim() });
      set('accessToken', '');
      setMessage({ tone: 'success', text: 'WhatsApp settings saved.' });
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fieldErrors);
      setMessage({ tone: 'error', text: parsed.message });
    }
  };

  const sendTest = async () => {
    setTestResult(null);
    try {
      const res = await test.mutateAsync(testPhone);
      const text = res.data.message || 'Test code 123456 sent. Check WhatsApp on that number.';
      setTestResult({ tone: text.includes("can't carry") ? 'warning' : 'success', text });
    } catch (err) {
      setTestResult({ tone: 'error', text: getErrorMessage(err) });
    }
  };

  const data = query.data;

  return (
    <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#25D366]/10">
            <WhatsAppIcon className="size-6 text-[#25D366]" />
          </span>
          <div>
            <h2 className="font-semibold text-ink">WhatsApp connection & sign-in codes</h2>
            <p className="mt-0.5 text-sm text-slate-500">Connects the clinic&apos;s WhatsApp number. Patients sign in with a 6-digit code; appointment and marketing messages use the same connection.</p>
          </div>
        </div>
        {data && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              data.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
            )}
          >
            {data.ready ? <CheckCircle2 className="size-3.5" aria-hidden /> : <CircleDashed className="size-3.5" aria-hidden />}
            {data.ready ? 'Active' : 'Not active'}
          </span>
        )}
      </div>

      {query.isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      ) : query.isError ? (
        <ErrorMessage className="mt-6" message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <form onSubmit={submit} noValidate className="space-y-5 lg:col-span-2">
            <AnimatePresence>{message && <Alert tone={message.tone}>{message.text}</Alert>}</AnimatePresence>
            <Checkbox
              label="Turn on WhatsApp (sign-in codes and messages)"
              checked={form.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Phone number ID" required inputMode="numeric" placeholder="1472524632613395" value={form.phoneNumberId}
                onChange={(e) => set('phoneNumberId', e.target.value.trim())} error={errors.phoneNumberId} />
              <Input label="WhatsApp Business Account ID" optional inputMode="numeric" placeholder="1498195968878261" value={form.businessAccountId}
                onChange={(e) => set('businessAccountId', e.target.value.trim())} error={errors.businessAccountId}
                hint="Shown as Messaging account ID. Needed to read your templates." />
            </div>
            <Input
              label="Access token"
              required={!data?.accessTokenSet}
              type="password"
              autoComplete="off"
              placeholder={data?.accessTokenSet ? `Saved token ending ••••${data.accessTokenLast4 ?? ''}. Leave empty to keep it.` : 'EAAG...'}
              value={form.accessToken}
              onChange={(e) => set('accessToken', e.target.value.trim())}
              error={errors.accessToken}
              hint="Stored on the server and never shown again. Use a permanent System User token; temporary tokens expire after 24 hours."
            />
            <div className="grid gap-5 sm:grid-cols-3">
              <Input label="Sign-in code template" required placeholder="otp" value={form.otpTemplateName} wrapperClassName="sm:col-span-2"
                onChange={(e) => set('otpTemplateName', e.target.value.trim())} error={errors.otpTemplateName} />
              <Input label="Template language" required placeholder="en_US" value={form.otpTemplateLanguage}
                onChange={(e) => set('otpTemplateLanguage', e.target.value.trim())} error={errors.otpTemplateLanguage} />
            </div>
            <Input label="Default country code" required inputMode="numeric" placeholder="91" value={form.defaultCountryCode} wrapperClassName="sm:max-w-48"
              onChange={(e) => set('defaultCountryCode', e.target.value.replace(/\D/g, ''))} error={errors.defaultCountryCode}
              hint="Added to numbers patients type without one." />
            <Button type="submit" loading={save.isPending} icon={<Save className="size-4" aria-hidden />}>Save WhatsApp settings</Button>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-ink">Send a test code</h3>
              <p className="mt-0.5 mb-3 text-sm text-slate-500">Uses the saved settings and sends the code 123456.</p>
              <AnimatePresence>{testResult && <Alert tone={testResult.tone} className="mb-3">{testResult.text}</Alert>}</AnimatePresence>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Input label="WhatsApp number" type="tel" placeholder="98765 43210" value={testPhone} wrapperClassName="flex-1"
                  onChange={(e) => setTestPhone(e.target.value)} />
                <Button type="button" variant="outline" className="sm:mt-7" loading={test.isPending} disabled={!testPhone.trim()}
                  onClick={sendTest} icon={<Send className="size-4" aria-hidden />}>
                  Send test
                </Button>
              </div>
            </div>
          </form>

          <aside className="h-fit rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-white/[0.03]">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink"><KeyRound className="size-4" aria-hidden /> Setup</h3>
            <ol className="list-decimal space-y-2.5 pl-4">
              <li>In Meta for Developers, open your app &rarr; <b>WhatsApp &rarr; API Setup</b>. Copy the <b>Phone number ID</b>.</li>
              <li>In WhatsApp Manager, create a message template of category <b>Authentication</b> with a <b>Copy code</b> button. Wait until it is approved, then enter its name and language.</li>
              <li>Create a <b>System User</b> token with <i>whatsapp_business_messaging</i> permission. The token on the API Setup page expires in 24 hours.</li>
              <li>The free test number can only message up to 5 recipient numbers you add in API Setup. Add a real business number for patients.</li>
            </ol>
          </aside>
        </div>
      )}
    </section>
  );
}
