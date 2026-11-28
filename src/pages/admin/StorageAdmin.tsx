import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { CheckCircle2, ClipboardPaste, Cloud, HardDrive, KeyRound, PlugZap, RotateCcw, Save } from 'lucide-react';
import type { CloudinaryPayload, StorageStatus, StorageTestResult } from '../../types';
import { useSaveStorage, useStorageStatus, useTestCloudinary, useUseEnvironmentStorage } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { parseCloudinaryUrl } from '../../utils/cloudinaryUrl';
import { getErrorMessage, parseApiError } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';
import { Input } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Spinner';
import { cn } from '../../utils/cn';
import { toast } from '../../components/ui/Toast';

const EMPTY: CloudinaryPayload = { cloudName: '', apiKey: '', apiSecret: '', folder: 'forever-dental-care' };

export default function StorageAdmin() {
  useDocumentTitle('Image storage');
  const status = useStorageStatus();
  const [message, setMessage] = useState<string | null>(null);

  const done = (text: string) => {
    setMessage(text);
    toast.success(text);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {message && (
          <Alert
            tone="success"
            title="Image storage changed"
            action={
              <button type="button" className="text-xs font-semibold underline" onClick={() => setMessage(null)}>
                Dismiss
              </button>
            }
          >
            {message}
          </Alert>
        )}
      </AnimatePresence>
      {status.isLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : status.isError ? (
        <ErrorMessage message={getErrorMessage(status.error)} onRetry={() => status.refetch()} />
      ) : (
        status.data && (
          <>
            <CurrentStorage status={status.data} />
            <ConnectCloudinary status={status.data} onSaved={done} />
            {status.data.provider === 'cloudinary' && <UseLocalStorage status={status.data} onSaved={done} />}
            {status.data.source === 'ADMIN_PANEL' && <BackToEnvironment status={status.data} onSaved={done} />}
          </>
        )
      )}
    </div>
  );
}

function Card({ icon, title, description, badge, children }: { icon: ReactNode; title: string; description: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
          <div>
            <h2 className="font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {badge}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Fact({ label, value, className }: { label: string; value?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-all text-ink">{value ?? '—'}</dd>
    </div>
  );
}

function formatBytes(bytes?: number): string | undefined {
  if (bytes == null) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function CurrentStorage({ status: s }: { status: StorageStatus }) {
  const cloud = s.provider === 'cloudinary';
  const fromPanel = s.source === 'ADMIN_PANEL';
  return (
    <Card
      icon={cloud ? <Cloud className="size-5" aria-hidden /> : <HardDrive className="size-5" aria-hidden />}
      title="Where new images are stored"
      description={
        fromPanel
          ? 'Set from this page. It is saved on the server and used again after a restart.'
          : 'Set by STORAGE_PROVIDER and CLOUDINARY_URL in backend/.env on the server.'
      }
      badge={
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            cloud ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-700',
          )}
        >
          {cloud ? <Cloud className="size-3.5" aria-hidden /> : <HardDrive className="size-3.5" aria-hidden />}
          {cloud ? 'Cloudinary' : 'This server'}
        </span>
      }
    >
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cloud ? (
          <>
            <Fact label="Cloud name" value={s.cloudName} />
            <Fact label="API key" value={s.apiKey} />
            <Fact label="Folder" value={s.folder || '(top level)'} />
            <Fact label="API secret" value="Saved on the server, never shown" />
            <Fact label="CLOUDINARY_URL" value={s.cloudinaryUrl} className="sm:col-span-2" />
          </>
        ) : (
          <Fact label="Upload folder on the server" value={s.uploadDir} className="sm:col-span-2" />
        )}
        <Fact label="Source" value={fromPanel ? 'Admin panel' : 'backend/.env'} />
        {fromPanel && <Fact label="Changed" value={s.savedAt ? `${formatDateTime(s.savedAt)}${s.savedBy ? ` by ${s.savedBy}` : ''}` : undefined} />}
      </dl>
      {cloud && (
        <p className="mt-5 text-sm text-slate-500">
          Images uploaded before the switch to Cloudinary are still served from the upload folder on this server ({s.uploadDir}).
        </p>
      )}
    </Card>
  );
}

function ConnectCloudinary({ status, onSaved }: { status: StorageStatus; onSaved: (message: string) => void }) {
  const test = useTestCloudinary();
  const save = useSaveStorage();
  const hasSaved = status.provider === 'cloudinary' && !!status.cloudName;
  const [form, setForm] = useState<CloudinaryPayload>(EMPTY);
  const [url, setUrl] = useState('');
  const [urlNote, setUrlNote] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testError, setTestError] = useState<string | null>(null);
  const [tested, setTested] = useState<StorageTestResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hasSaved) {
      setForm({ cloudName: status.cloudName ?? '', apiKey: status.apiKey ?? '', apiSecret: '', folder: status.folder ?? '' });
    }
  }, [hasSaved, status.cloudName, status.apiKey, status.folder]);

  const set = <K extends keyof CloudinaryPayload>(key: K, value: CloudinaryPayload[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTested(null); // a test only counts for the exact values tested
  };

  const applyUrl = (text: string) => {
    setUrl(text);
    if (!text.trim()) {
      setUrlNote(null);
      return;
    }
    const parsed = parseCloudinaryUrl(text);
    if (!parsed) {
      setUrlNote({ tone: 'error', text: 'This does not look like a CLOUDINARY_URL. It should start with cloudinary://' });
      return;
    }
    setForm((f) => ({ ...f, ...parsed, apiSecret: parsed.apiSecret ?? '' }));
    setTested(null);
    setUrlNote({
      tone: 'info',
      text: parsed.apiSecret ? 'Fields filled in from the CLOUDINARY_URL.' : 'Fields filled in. Now type the API secret below.',
    });
  };

  // The secret may be kept only when cloud name and API key are unchanged.
  const keepsSavedSecret = hasSaved && form.cloudName === status.cloudName && form.apiKey === status.apiKey;
  const payload = (): CloudinaryPayload => ({
    cloudName: form.cloudName.trim(),
    apiKey: form.apiKey.trim(),
    apiSecret: form.apiSecret.trim(),
    folder: form.folder.trim(),
  });

  const runTest = async () => {
    setErrors({});
    setTestError(null);
    setTested(null);
    try {
      setTested(await test.mutateAsync(payload()));
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fieldErrors);
      setTestError(Object.keys(parsed.fieldErrors).length ? null : parsed.message);
    }
  };

  const runSave = async () => {
    setSaveError(null);
    try {
      const res = await save.mutateAsync({ provider: 'cloudinary', cloudinary: payload(), currentPassword: password });
      setConfirming(false);
      setPassword('');
      setTested(null);
      setUrl('');
      setUrlNote(null);
      setForm((f) => ({ ...f, apiSecret: '' }));
      onSaved(res.message);
    } catch (err) {
      const parsed = parseApiError(err);
      setSaveError(parsed.fieldErrors.currentPassword ?? parsed.message);
    }
  };

  const unchanged = tested?.sameAsCurrent && status.provider === 'cloudinary' && !form.apiSecret;

  return (
    <Card
      icon={<PlugZap className="size-5" aria-hidden />}
      title={hasSaved ? 'Cloudinary account' : 'Connect Cloudinary'}
      description="Store uploaded images in Cloudinary and serve them from its CDN. Test the details first; nothing changes until you save."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Input
            label="Paste your CLOUDINARY_URL"
            optional
            placeholder="cloudinary://<api_key>:<api_secret>@<cloud_name>"
            value={url}
            onChange={(e) => applyUrl(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            hint="Fills in the fields below. Nothing is sent until you press Test connection."
          />
          {urlNote && (
            <p className={cn('-mt-3 flex items-center gap-1.5 text-sm', urlNote.tone === 'error' ? 'text-red-600' : 'text-brand-700')}>
              <ClipboardPaste className="size-3.5" aria-hidden /> {urlNote.text}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input label="Cloud name" required placeholder="my-cloud" value={form.cloudName}
              onChange={(e) => set('cloudName', e.target.value.trim())} error={errors.cloudName} autoComplete="off" spellCheck={false} />
            <Input label="API key" required placeholder="123456789012345" value={form.apiKey}
              onChange={(e) => set('apiKey', e.target.value.trim())} error={errors.apiKey} autoComplete="off" spellCheck={false} />
          </div>
          <Input
            label="API secret"
            required={!keepsSavedSecret}
            type="password"
            autoComplete="new-password"
            placeholder={keepsSavedSecret ? 'Leave empty to keep the saved secret' : 'From API Keys in the Cloudinary console'}
            value={form.apiSecret}
            onChange={(e) => set('apiSecret', e.target.value.trim())}
            error={errors.apiSecret}
            hint="Saved on the server only and never shown again."
          />
          <Input label="Folder" optional placeholder="forever-dental-care" value={form.folder}
            onChange={(e) => set('folder', e.target.value.trim())} error={errors.folder}
            hint="New images go into this Cloudinary folder. Leave empty for the top level." />

          <Button variant="outline" loading={test.isPending} disabled={!form.cloudName || !form.apiKey} onClick={runTest}
            icon={<PlugZap className="size-4" aria-hidden />}>
            Test connection
          </Button>

          <AnimatePresence>{testError && <Alert tone="error" title="Connection failed">{testError}</Alert>}</AnimatePresence>
          {tested && <TestSummary result={tested} />}

          {tested && !unchanged && (
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-ink">
                {status.provider === 'cloudinary' ? 'Save these Cloudinary details' : 'Store new images in Cloudinary'}
              </h3>
              <p className="text-sm text-slate-500">
                New uploads use these details as soon as you save. Images already uploaded keep working where they are.
              </p>
              <Button icon={<Save className="size-4" aria-hidden />} onClick={() => { setSaveError(null); setConfirming(true); }}>
                {status.provider === 'cloudinary' ? 'Save…' : 'Use Cloudinary…'}
              </Button>
            </div>
          )}
          {unchanged && <p className="text-sm text-slate-500">These are the details the app is already using.</p>}
        </div>

        <CloudinaryHelp />
      </div>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={status.provider === 'cloudinary' ? 'Save Cloudinary details?' : 'Store new images in Cloudinary?'}
        description={`Cloud "${form.cloudName}"${form.folder ? `, folder ${form.folder}` : ''}`}
        points={[
          'New uploads go to this Cloudinary account immediately. No restart needed.',
          'Existing images are not moved and keep working.',
          'The API secret is saved in storage-connection.json on the server.',
        ]}
        confirmLabel="Save"
        password={password}
        onPassword={setPassword}
        error={saveError}
        loading={save.isPending}
        onConfirm={runSave}
      />
    </Card>
  );
}

function TestSummary({ result: r }: { result: StorageTestResult }) {
  return (
    <Alert tone="success" title="Connection works">
      <ul className="list-disc space-y-1 pl-4">
        <li>
          Cloudinary accepted the details for cloud <b>{r.cloudName}</b>
          {r.folder ? `. New images go into folder ${r.folder}.` : '.'}
        </li>
        {(r.plan || r.storageBytes != null) && (
          <li>
            {r.plan ? `${r.plan} plan` : 'Account'}
            {r.storageBytes != null ? `, ${formatBytes(r.storageBytes)} stored` : ''}
            {r.resources != null ? ` in ${r.resources} files` : ''}
            {r.creditsUsedPercent != null ? `, ${r.creditsUsedPercent.toFixed(1)}% of monthly credits used` : ''}.
          </li>
        )}
      </ul>
    </Alert>
  );
}

function ConfirmModal({
  open, onClose, title, description, points, confirmLabel, password, onPassword, error, loading, onConfirm,
}: {
  open: boolean; onClose: () => void; title: string; description: string; points: string[]; confirmLabel: string;
  password: string; onPassword: (v: string) => void; error: string | null; loading: boolean; onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirm} loading={loading} disabled={!password}>{confirmLabel}</Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (password && !loading) onConfirm();
        }}
      >
        <ul className="list-disc space-y-1.5 pl-4 text-sm text-slate-600">
          {points.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <Input label="Your admin password" type="password" autoComplete="current-password" required value={password}
          onChange={(e) => onPassword(e.target.value)} error={error ?? undefined} autoFocus />
      </form>
    </Modal>
  );
}

/** Shared state for the two password-confirmed actions below. */
function usePasswordAction(run: (password: string) => Promise<{ message: string }>, onSaved: (m: string) => void) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setError(null);
    try {
      const res = await run(password);
      setOpen(false);
      setPassword('');
      onSaved(res.message);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.fieldErrors.currentPassword ?? parsed.message);
    }
  };
  return { open, setOpen: (v: boolean) => { setError(null); setOpen(v); }, password, setPassword, error, confirm };
}

function UseLocalStorage({ status, onSaved }: { status: StorageStatus; onSaved: (message: string) => void }) {
  const save = useSaveStorage();
  const action = usePasswordAction((currentPassword) => save.mutateAsync({ provider: 'local', currentPassword }), onSaved);
  return (
    <Card
      icon={<HardDrive className="size-5" aria-hidden />}
      title="Store images on this server instead"
      description="Stop uploading to Cloudinary. New images are saved in the upload folder on this server."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Images already in Cloudinary keep working as long as the Cloudinary account exists. Back up {status.uploadDir} together with the database.
        </p>
        <Button variant="outline" onClick={() => action.setOpen(true)} icon={<HardDrive className="size-4" aria-hidden />}>
          Use this server…
        </Button>
      </div>
      <ConfirmModal
        open={action.open}
        onClose={() => action.setOpen(false)}
        title="Store new images on this server?"
        description={status.uploadDir ?? ''}
        points={['New uploads are saved on this server immediately.', 'Images already in Cloudinary are not moved or deleted.']}
        confirmLabel="Use this server"
        password={action.password}
        onPassword={action.setPassword}
        error={action.error}
        loading={save.isPending}
        onConfirm={action.confirm}
      />
    </Card>
  );
}

function BackToEnvironment({ status, onSaved }: { status: StorageStatus; onSaved: (message: string) => void }) {
  const mutation = useUseEnvironmentStorage();
  const action = usePasswordAction((currentPassword) => mutation.mutateAsync({ currentPassword }), onSaved);
  const envLabel = status.environmentProvider === 'cloudinary'
    ? `Cloudinary${status.environmentCloudName ? ` (cloud "${status.environmentCloudName}")` : ''}`
    : status.environmentProvider === 'local'
      ? 'this server (local upload folder)'
      : 'not valid (check STORAGE_PROVIDER and CLOUDINARY_URL)';
  return (
    <Card
      icon={<RotateCcw className="size-5" aria-hidden />}
      title="Go back to the backend/.env settings"
      description="Forget the settings saved on this page and use STORAGE_PROVIDER and CLOUDINARY_URL from backend/.env again."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">backend/.env stores new images in <b>{envLabel}</b>.</p>
        <Button variant="outline" onClick={() => action.setOpen(true)} icon={<RotateCcw className="size-4" aria-hidden />}>
          Use the backend/.env settings…
        </Button>
      </div>
      <ConfirmModal
        open={action.open}
        onClose={() => action.setOpen(false)}
        title="Go back to the backend/.env settings?"
        description={`New images will be stored in ${envLabel}.`}
        points={[`${status.configFile ?? 'storage-connection.json'} is deleted, including the saved API secret.`, 'Existing images are not moved.']}
        confirmLabel="Use backend/.env"
        password={action.password}
        onPassword={action.setPassword}
        error={action.error}
        loading={mutation.isPending}
        onConfirm={action.confirm}
      />
    </Card>
  );
}

function CloudinaryHelp() {
  return (
    <aside className="h-fit rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-white/[0.03]">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink"><KeyRound className="size-4" aria-hidden /> Finding your keys</h3>
      <ol className="list-decimal space-y-2.5 pl-4">
        <li>Sign in to the <b>Cloudinary console</b>.</li>
        <li>Open <b>Settings → API Keys</b>. The cloud name is shown at the top of that page.</li>
        <li>
          Copy the <b>API environment variable</b> (it starts with <code>cloudinary://</code>) and paste it above, or copy the API key
          and API secret into the fields.
        </li>
        <li>Press <b>Test connection</b>, then save with your admin password.</li>
      </ol>
      <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        The test only checks the keys with Cloudinary. It does not upload anything.
      </p>
    </aside>
  );
}
