import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Save, Send, Trash2 } from 'lucide-react';
import type { MetaTemplate, TemplateParam, TemplateParamSource, TemplatePurpose, WhatsAppTemplate } from '../../../types';
import {
  useDeleteWhatsAppTemplate,
  useSaveWhatsAppTemplate,
  useTemplateNameDetails,
  useTemplateNames,
  useTestWhatsAppTemplate,
} from '../../../hooks/useAdminData';
import { TemplateNamePicker, templateKey } from './TemplateNamePicker';
import { getErrorMessage, parseApiError } from '../../../utils/errors';
import { Checkbox, Input, Select } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { cn } from '../../../utils/cn';

export const SOURCE_LABELS: Record<TemplateParamSource, string> = {
  PATIENT_NAME: 'Patient name',
  PATIENT_FIRST_NAME: 'Patient first name',
  SERVICE_NAME: 'Treatment',
  DOCTOR_NAME: 'Doctor',
  APPOINTMENT_DATE: 'Appointment date',
  APPOINTMENT_TIME: 'Appointment time',
  BOOKING_REFERENCE: 'Booking reference',
  CLINIC_NAME: 'Clinic name',
  CLINIC_PHONE: 'Clinic phone',
  CLINIC_ADDRESS: 'Clinic address',
  CUSTOM_TEXT: 'Custom text…',
};
const APPOINTMENT_ONLY: TemplateParamSource[] = ['SERVICE_NAME', 'DOCTOR_NAME', 'APPOINTMENT_DATE', 'APPOINTMENT_TIME', 'BOOKING_REFERENCE'];
const APPOINTMENT_DEFAULTS: TemplateParamSource[] = ['PATIENT_NAME', 'SERVICE_NAME', 'DOCTOR_NAME', 'APPOINTMENT_DATE', 'APPOINTMENT_TIME', 'BOOKING_REFERENCE'];
const MARKETING_DEFAULTS: TemplateParamSource[] = ['PATIENT_FIRST_NAME', 'CUSTOM_TEXT', 'CUSTOM_TEXT', 'CUSTOM_TEXT'];

const PURPOSE_HELP: Record<TemplatePurpose, string> = {
  APPOINTMENT_RECEIVED: 'Sent right after a patient books (appointment is pending).',
  APPOINTMENT_CONFIRMED: 'Sent when you confirm an appointment.',
  APPOINTMENT_CANCELLED: 'Sent when you cancel an appointment.',
  APPOINTMENT_RESCHEDULED: 'Sent when you move an appointment to a new date or time.',
  MARKETING: 'Sent as a campaign to all patients.',
};

export const PURPOSE_LABELS: Record<TemplatePurpose, string> = {
  APPOINTMENT_RECEIVED: 'Appointment received',
  APPOINTMENT_CONFIRMED: 'Appointment confirmed',
  APPOINTMENT_CANCELLED: 'Appointment cancelled',
  APPOINTMENT_RESCHEDULED: 'Appointment rescheduled',
  MARKETING: 'Marketing',
};
export const AUTOMATIC_PURPOSES: TemplatePurpose[] = ['APPOINTMENT_RECEIVED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED'];

function resize(list: TemplateParam[], count: number, defaults: TemplateParamSource[], offset = 0): TemplateParam[] {
  const next = list.slice(0, count);
  while (next.length < count) {
    next.push({ source: defaults[(next.length + offset) % defaults.length] ?? 'CUSTOM_TEXT', text: '' });
  }
  return next;
}

interface TemplateEditorProps {
  /** MARKETING, or the event of an appointment message. For a new appointment message, the first free event. */
  purpose: TemplatePurpose;
  template?: WhatsAppTemplate;
  /** For a new appointment message: events that can still be chosen. */
  freePurposes?: TemplatePurpose[];
  defaultOpen?: boolean;
  /** For a new (unsaved) message. */
  onCancelNew?: () => void;
}

export function TemplateEditor({ purpose: initialPurpose, template, freePurposes, defaultOpen, onCancelNew }: TemplateEditorProps) {
  const [purpose, setPurpose] = useState<TemplatePurpose>(template?.purpose ?? initialPurpose);
  const isMarketing = purpose === 'MARKETING';
  const save = useSaveWhatsAppTemplate();
  const remove = useDeleteWhatsAppTemplate();
  const test = useTestWhatsAppTemplate();
  const names = useTemplateNames();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [label, setLabel] = useState(template?.label ?? '');
  const [enabled, setEnabled] = useState(template?.enabled ?? false);
  const [selected, setSelected] = useState(templateKey(template?.templateName, template?.templateLanguage));
  const [headerParams, setHeaderParams] = useState<TemplateParam[]>(template?.headerParams ?? []);
  const [bodyParams, setBodyParams] = useState<TemplateParam[]>(template?.bodyParams ?? []);
  const [buttonParams, setButtonParams] = useState<TemplateParam[]>(template?.buttonParams ?? []);
  const [mediaUrl, setMediaUrl] = useState(template?.headerMediaUrl ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const savedName = (names.data ?? []).find((n) => templateKey(n.name, n.language) === selected);
  const details = useTemplateNameDetails(open ? savedName?.id : undefined);
  const meta = details.data;
  const valueButtons = meta?.buttons.filter((b) => b.needsValue) ?? [];
  const mediaHeader = meta?.headerFormat && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(meta.headerFormat);
  const sources = (Object.keys(SOURCE_LABELS) as TemplateParamSource[]).filter((s) => !isMarketing || !APPOINTMENT_ONLY.includes(s));
  const defaults = isMarketing ? MARKETING_DEFAULTS : APPOINTMENT_DEFAULTS;

  // Keep the mapping lists the same length as the chosen template's placeholders.
  useEffect(() => {
    if (!meta) return;
    setHeaderParams((p) => resize(p, meta.headerParams, defaults));
    setBodyParams((p) => resize(p, meta.bodyParams, defaults));
    setButtonParams((p) => resize(p, valueButtons.length, ['CUSTOM_TEXT']));
  }, [meta?.name, meta?.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setErrors({});
    setMessage(null);
    const [name, language] = selected ? selected.split('|') : ['', 'en_US'];
    try {
      await save.mutateAsync({
        id: template?.id,
        payload: {
          purpose: template ? undefined : purpose,
          label: isMarketing ? label.trim() : undefined,
          enabled,
          templateName: name,
          templateLanguage: language || 'en_US',
          headerParams,
          bodyParams,
          buttonParams,
          headerMediaUrl: mediaHeader ? mediaUrl.trim() : undefined,
        },
      });
      setMessage({ tone: 'success', text: enabled ? 'Saved. This message is on.' : 'Saved. This message is off.' });
      if (!template) onCancelNew?.();
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fieldErrors);
      setMessage({ tone: 'error', text: Object.values(parsed.fieldErrors)[0] ?? parsed.message });
    }
  };

  const sendTest = async () => {
    if (!template) return;
    setTestResult(null);
    try {
      const res = await test.mutateAsync({ id: template.id, phone: testPhone });
      setTestResult({ tone: 'success', text: res.data.message || 'Test message sent.' });
    } catch (err) {
      setTestResult({ tone: 'error', text: getErrorMessage(err) });
    }
  };

  const title = isMarketing ? template?.label || 'New marketing template' : template?.label || `New message: ${PURPOSE_LABELS[purpose]}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-soft dark:border-white/10">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 p-4 text-left sm:px-6">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{title}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {template?.templateName ? `${template.templateName} · ${template.templateLanguage}` : PURPOSE_HELP[purpose]}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {template && (
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', template.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
              {template.enabled ? 'On' : 'Off'}
            </span>
          )}
          <ChevronDown className={cn('size-5 text-slate-400 transition-transform', open && 'rotate-180')} aria-hidden />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-5 border-t border-slate-100 p-4 sm:p-6 dark:border-white/5">
              <p className="text-sm text-slate-500">{PURPOSE_HELP[purpose]}</p>
              <AnimatePresence>{message && <Alert tone={message.tone}>{message.text}</Alert>}</AnimatePresence>

              {isMarketing && (
                <Input label="Name (for you)" required placeholder="e.g. Free check-up camp" value={label} onChange={(e) => setLabel(e.target.value)} error={errors.label} />
              )}

              {!template && !isMarketing && freePurposes && (
                <Select label="When to send" required value={purpose} onChange={(e) => setPurpose(e.target.value as TemplatePurpose)} error={errors.purpose}>
                  {freePurposes.map((p) => (
                    <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
                  ))}
                </Select>
              )}

              <TemplateNamePicker value={selected} onChange={setSelected} error={errors.templateName} />
              {details.isFetching && <p className="text-sm text-slate-500">Reading the template from WhatsApp…</p>}
              {details.isError && <Alert tone="error">{getErrorMessage(details.error)}</Alert>}

              {meta && (
                <>
                  {meta.status !== 'APPROVED' && (
                    <Alert tone="warning">This template is {meta.status.toLowerCase()} in WhatsApp. It can only be switched on once Meta approves it.</Alert>
                  )}
                  {isMarketing && meta.category !== 'MARKETING' && (
                    <Alert tone="warning">This is a {meta.category.toLowerCase()} template. Promotional campaigns should use a Marketing template (Meta policy).</Alert>
                  )}
                  {!isMarketing && meta.category === 'MARKETING' && (
                    <Alert tone="warning">This is a Marketing template. Appointment updates should use a Utility template; Marketing messages are charged at a higher rate.</Alert>
                  )}

                  <Preview meta={meta} header={headerParams} body={bodyParams} />

                  {mediaHeader && (
                    <Input label={`Header ${meta.headerFormat?.toLowerCase()} link`} required placeholder="https://res.cloudinary.com/…" value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)} error={errors.headerMediaUrl} hint="A public https:// link. You can upload in Website content and copy the image link." />
                  )}
                  <ParamGroup title="Header" params={headerParams} onChange={setHeaderParams} sources={sources} />
                  <ParamGroup title="Message" params={bodyParams} onChange={setBodyParams} sources={sources} error={errors.bodyParams} />
                  <ParamGroup
                    title="Buttons"
                    params={buttonParams}
                    onChange={setButtonParams}
                    sources={sources}
                    names={valueButtons.map((b) => `${b.text || b.type} button`)}
                    error={errors.buttonParams}
                  />
                </>
              )}

              <Checkbox label={isMarketing ? 'Ready to send as a campaign' : 'Send this message automatically'} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={submit} loading={save.isPending} icon={<Save className="size-4" aria-hidden />}>Save</Button>
                {!template && onCancelNew && <Button variant="ghost" onClick={onCancelNew}>Cancel</Button>}
                {template && (
                  <Button
                    variant="ghostDanger"
                    loading={remove.isPending}
                    icon={<Trash2 className="size-4" aria-hidden />}
                    onClick={() => {
                      if (window.confirm(`Remove "${template.label}"?`)) remove.mutate(template.id);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>

              {template?.templateName && (
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                  <p className="mb-3 text-sm font-semibold text-ink">Send a test with example data</p>
                  <AnimatePresence>{testResult && <Alert tone={testResult.tone} className="mb-3">{testResult.text}</Alert>}</AnimatePresence>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Input label="WhatsApp number" type="tel" placeholder="98765 43210" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} wrapperClassName="flex-1" />
                    <Button variant="outline" onClick={sendTest} loading={test.isPending} disabled={!testPhone.trim()} icon={<Send className="size-4" aria-hidden />}>
                      Send test
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ParamGroup({ title, params, onChange, sources, names, error }: {
  title: string;
  params: TemplateParam[];
  onChange: (p: TemplateParam[]) => void;
  sources: TemplateParamSource[];
  names?: string[];
  error?: string;
}) {
  if (params.length === 0) return null;
  const update = (i: number, patch: Partial<TemplateParam>) => onChange(params.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold text-ink">{title}</legend>
      {params.map((p, i) => (
        <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr_1fr] sm:items-center">
          <span className="text-sm font-medium text-slate-500">{names?.[i] ?? `{{${i + 1}}}`}</span>
          <Select aria-label={`${title} value ${i + 1}`} value={p.source} onChange={(e) => update(i, { source: e.target.value as TemplateParamSource })}>
            {sources.map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
            ))}
          </Select>
          {p.source === 'CUSTOM_TEXT' ? (
            <Input aria-label={`${title} text ${i + 1}`} placeholder="Text to send" value={p.text ?? ''} onChange={(e) => update(i, { text: e.target.value })} />
          ) : (
            <span />
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}

/** WhatsApp-style bubble showing the template text with the chosen value for each placeholder. */
function Preview({ meta, header, body }: { meta: MetaTemplate; header: TemplateParam[]; body: TemplateParam[] }) {
  const fill = (text: string, params: TemplateParam[]): ReactNode[] =>
    text.split(/(\{\{\s*\d+\s*}})/g).map((part, i) => {
      const m = part.match(/\{\{\s*(\d+)\s*}}/);
      if (!m) return part;
      const p = params[Number(m[1]) - 1];
      const label = p ? (p.source === 'CUSTOM_TEXT' ? p.text || 'Custom text' : SOURCE_LABELS[p.source]) : part;
      return <mark key={i} className="rounded bg-brand-100 px-1 text-brand-800 dark:bg-brand-400/20 dark:text-brand-200">{label}</mark>;
    });
  return (
    <div className="rounded-2xl bg-[#e7ddd3] p-4 dark:bg-[#0b141a]">
      <div className="max-w-md rounded-xl rounded-tl-none bg-white p-3 text-sm whitespace-pre-line text-ink shadow-sm ring-1 ring-black/5 dark:bg-[#1f2c33] dark:ring-white/5">
        {meta.headerFormat && meta.headerFormat !== 'TEXT' && (
          <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-slate-200 text-xs font-medium text-slate-500 dark:bg-white/10">{meta.headerFormat.toLowerCase()}</div>
        )}
        {meta.headerFormat === 'TEXT' && meta.headerText && <p className="mb-1 font-semibold">{fill(meta.headerText, header)}</p>}
        <p>{fill(meta.bodyText, body)}</p>
        {meta.footerText && <p className="mt-1 text-xs text-muted">{meta.footerText}</p>}
        {meta.buttons.length > 0 && (
          <div className="mt-2 divide-y divide-slate-100 border-t border-slate-100 text-center text-sm font-medium text-sky-600 dark:divide-white/10 dark:border-white/10">
            {meta.buttons.map((b) => (
              <p key={b.index} className="py-1.5">{b.text || b.type}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
