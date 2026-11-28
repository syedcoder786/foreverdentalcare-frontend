import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { CalendarCheck, Megaphone, Plug, Plus, Send, Tags, Users } from 'lucide-react';
import type { WhatsAppTemplate } from '../../types';
import {
  useStartWhatsAppCampaign,
  useWhatsAppAudience,
  useWhatsAppCampaigns,
  useWhatsAppSettings,
  useWhatsAppTemplates,
} from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { WhatsAppSettingsCard } from '../../components/admin/WhatsAppSettingsCard';
import { AUTOMATIC_PURPOSES, TemplateEditor } from '../../components/admin/whatsapp/TemplateEditor';
import { TemplateNameLibrary } from '../../components/admin/whatsapp/TemplateNamePicker';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Spinner';
import { formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';
import { toast } from '../../components/ui/Toast';

type Tab = 'setup' | 'names' | 'appointments' | 'marketing';
const TABS: Array<{ id: Tab; label: string; icon: typeof Plug }> = [
  { id: 'setup', label: 'Setup', icon: Plug },
  { id: 'names', label: 'Template names', icon: Tags },
  { id: 'appointments', label: 'Appointment messages', icon: CalendarCheck },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
];

export default function WhatsAppAdmin() {
  useDocumentTitle('WhatsApp');
  const [tab, setTab] = useState<Tab>('setup');
  const settings = useWhatsAppSettings();
  const connected = Boolean(settings.data?.phoneNumberId && settings.data?.accessTokenSet);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 relative overflow-x-auto rounded-2xl border border-slate-200 bg-surface p-1 shadow-soft" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              tab === id ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-100' : 'text-slate-600 hover:bg-slate-50 hover:text-ink',
            )}
          >
            <Icon className="size-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {tab === 'setup' && <WhatsAppSettingsCard />}
      {tab === 'names' && <TemplateNameLibrary />}
      {(tab === 'appointments' || tab === 'marketing') && !settings.isLoading && !connected && (
        <Alert tone="warning">Connect WhatsApp first: enter the Phone number ID, Business Account ID and access token in Setup.</Alert>
      )}
      {tab === 'appointments' && connected && <AppointmentMessages />}
      {tab === 'marketing' && connected && <Marketing />}
    </div>
  );
}

function AppointmentMessages() {
  const templates = useWhatsAppTemplates();
  const [adding, setAdding] = useState(false);
  if (templates.isLoading) return <ListSkeleton />;
  if (templates.isError) return <ErrorMessage message={getErrorMessage(templates.error)} onRetry={() => templates.refetch()} />;
  const automatic = (templates.data ?? []).filter((t) => t.purpose !== 'MARKETING');
  const free = AUTOMATIC_PURPOSES.filter((p) => !automatic.some((t) => t.purpose === p));
  return (
    <section className="space-y-4">
      <Intro
        title="Automatic appointment messages"
        text="Add a message for each event you want, pick a saved template name and choose what fills its placeholders. Messages are sent in the background; a WhatsApp problem never blocks a booking."
      />
      {automatic.length === 0 && !adding && <p className="text-sm text-slate-500">No appointment messages yet.</p>}
      {automatic.map((t) => (
        <TemplateEditor key={t.id} purpose={t.purpose} template={t} />
      ))}
      {adding && free.length > 0 ? (
        <TemplateEditor key={free.join()} purpose={free[0]} freePurposes={free} defaultOpen onCancelNew={() => setAdding(false)} />
      ) : (
        free.length > 0 && (
          <Button variant="outline" icon={<Plus className="size-4" aria-hidden />} onClick={() => setAdding(true)}>
            Add appointment message
          </Button>
        )
      )}
    </section>
  );
}

function Marketing() {
  const templates = useWhatsAppTemplates();
  const audience = useWhatsAppAudience();
  const [adding, setAdding] = useState(false);
  const marketing = (templates.data ?? []).filter((t) => t.purpose === 'MARKETING');

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Intro title="Marketing templates" text="Promotional templates you can send as campaigns to all your patients." />
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-100">
            <Users className="size-4" aria-hidden /> {audience.data?.optedInPatients ?? '…'} patients
          </span>
        </div>
        {templates.isLoading ? (
          <ListSkeleton />
        ) : (
          <>
            {marketing.map((t) => (
              <TemplateEditor key={t.id} purpose="MARKETING" template={t} />
            ))}
            {adding ? (
              <TemplateEditor purpose="MARKETING" defaultOpen onCancelNew={() => setAdding(false)} />
            ) : (
              <Button variant="outline" icon={<Plus className="size-4" aria-hidden />} onClick={() => setAdding(true)}>
                Add marketing template
              </Button>
            )}
          </>
        )}
      </section>

      <CampaignSender templates={marketing.filter((t) => t.enabled)} audience={audience.data?.optedInPatients ?? 0} />
      <CampaignHistory />
    </div>
  );
}

function CampaignSender({ templates, audience }: { templates: WhatsAppTemplate[]; audience: number }) {
  const start = useStartWhatsAppCampaign();
  const [templateId, setTemplateId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const chosen = templates.find((t) => String(t.id) === templateId);

  const send = async () => {
    setResult(null);
    try {
      await start.mutateAsync(Number(templateId));
      setResult({ tone: 'success', text: `Campaign started. Sending to ${audience} patients; progress is shown below.` });
      toast.success(`Campaign started. Sending to ${audience} patients.`);
      setTemplateId('');
    } catch (err) {
      setResult({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-6">
      <h2 className="flex items-center gap-2 font-semibold text-ink"><Send className="size-4 text-brand-600" aria-hidden /> Send a campaign</h2>
      <p className="mt-1 mb-4 text-sm text-slate-500">Sends the chosen template to every patient. Use "Send test" on the template first.</p>
      <AnimatePresence>{result && <Alert tone={result.tone} className="mb-4">{result.text}</Alert>}</AnimatePresence>
      {templates.length === 0 ? (
        <p className="text-sm text-slate-500">Save a marketing template with "Ready to send as a campaign" ticked to send it here.</p>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select label="Template" value={templateId} onChange={(e) => setTemplateId(e.target.value)} wrapperClassName="flex-1">
            <option value="">Choose…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.label} ({t.templateName})</option>
            ))}
          </Select>
          <Button disabled={!templateId || audience === 0} onClick={() => setConfirming(true)} icon={<Megaphone className="size-4" aria-hidden />}>
            Send to {audience} {audience === 1 ? 'patient' : 'patients'}
          </Button>
        </div>
      )}
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Send this campaign?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button onClick={send} loading={start.isPending}>Send now</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          <b>{chosen?.label}</b> will be sent on WhatsApp to <b>{audience}</b> {audience === 1 ? 'patient' : 'patients'}. This can't be undone, and Meta charges per marketing message.
        </p>
      </Modal>
    </section>
  );
}

function CampaignHistory() {
  const campaigns = useWhatsAppCampaigns();
  if (!campaigns.data?.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-6">
      <h2 className="mb-4 font-semibold text-ink">Recent campaigns</h2>
      <ul className="divide-y divide-slate-100 dark:divide-white/5">
        {campaigns.data.map((c) => {
          const done = c.sent + c.failed;
          const pct = c.total ? Math.round((done / c.total) * 100) : 100;
          return (
            <li key={c.id} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-medium text-ink">{c.templateLabel}</p>
                <p className="text-xs text-slate-500">{formatDateTime(c.createdAt)}{c.createdBy ? ` · ${c.createdBy}` : ''}</p>
                {c.status === 'SENDING' && (
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-emerald-700">{c.sent} sent</span>
                {c.failed > 0 && <span className="text-red-600">{c.failed} failed</span>}
                <span className="text-slate-400">of {c.total}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : c.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-sky-50 text-sky-700')}>
                  {c.status === 'SENDING' ? 'Sending…' : c.status === 'COMPLETED' ? 'Done' : 'Failed'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Intro({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-16 rounded-2xl" />
    </div>
  );
}
