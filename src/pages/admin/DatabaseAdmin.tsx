import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { ArrowLeftRight, CheckCircle2, ClipboardPaste, Database, KeyRound, PlugZap, RotateCcw, XCircle } from 'lucide-react';
import type { DatabaseConnectionPayload, DatabaseStatus, DatabaseSwitchResult, DatabaseTestResult, SslMode } from '../../types';
import { useDatabaseStatus, useSwitchDatabase, useTestDatabase, useUseEnvironmentDatabase } from '../../hooks/useAdminData';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useAuth } from '../../context/AuthContext';
import { parseConnectionString } from '../../utils/databaseUrl';
import { getErrorMessage, parseApiError } from '../../utils/errors';
import { formatDateTime } from '../../utils/format';
import { Checkbox, Input, Select } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Alert, ErrorMessage } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Spinner';
import { cn } from '../../utils/cn';

const EMPTY: DatabaseConnectionPayload = {
  host: '',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '',
  schema: 'dental_clinic',
  sslMode: 'require',
};

const SSL_OPTIONS: Array<{ value: SslMode; label: string }> = [
  { value: 'require', label: 'require (encrypted, recommended)' },
  { value: 'verify-full', label: 'verify-full (encrypted, checks certificate)' },
  { value: 'prefer', label: 'prefer (encrypt if possible)' },
  { value: 'disable', label: 'disable (local database only)' },
];

export default function DatabaseAdmin() {
  useDocumentTitle('Database');
  const status = useDatabaseStatus();
  const [result, setResult] = useState<DatabaseSwitchResult | null>(null);

  return (
    <div className="space-y-6">
      <AnimatePresence>{result && <SwitchResultNotice result={result} />}</AnimatePresence>
      {status.isLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : status.isError ? (
        <ErrorMessage message={getErrorMessage(status.error)} onRetry={() => status.refetch()} />
      ) : (
        status.data && (
          <>
            <CurrentConnection status={status.data} />
            <ConnectDatabase status={status.data} onSwitched={setResult} />
            {status.data.source === 'ADMIN_PANEL' && <BackToEnvironment status={status.data} onSwitched={setResult} />}
          </>
        )
      )}
    </div>
  );
}

function SwitchResultNotice({ result }: { result: DatabaseSwitchResult }) {
  const { logout } = useAuth();
  return (
    <Alert
      tone="success"
      title="Database switched"
      action={
        result.signInAgain ? (
          <Button size="sm" onClick={() => logout()}>
            Sign in again
          </Button>
        ) : undefined
      }
    >
      {result.message}
    </Alert>
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

function Fact({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-all text-ink">{value ?? '—'}</dd>
    </div>
  );
}

function CurrentConnection({ status: s }: { status: DatabaseStatus }) {
  const fromPanel = s.source === 'ADMIN_PANEL';
  return (
    <Card
      icon={<Database className="size-5" aria-hidden />}
      title="Current database"
      description={
        fromPanel
          ? 'Set from this page. It is saved on the server and used again after a restart.'
          : 'Set by the DB_* values in backend/.env on the server.'
      }
      badge={
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            s.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
          )}
        >
          {s.connected ? <CheckCircle2 className="size-3.5" aria-hidden /> : <XCircle className="size-3.5" aria-hidden />}
          {s.connected ? 'Connected' : 'Not reachable'}
        </span>
      }
    >
      {s.error && <Alert tone="error" className="mb-5">{s.error}</Alert>}
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {fromPanel ? (
          <>
            <Fact label="Host" value={s.host} />
            <Fact label="Port" value={s.port} />
            <Fact label="Database" value={s.database} />
            <Fact label="User" value={s.username} />
          </>
        ) : (
          <>
            <div className="sm:col-span-2"><Fact label="Connection" value={s.jdbcUrl} /></div>
            <Fact label="User" value={s.username} />
            <Fact label="Source" value="backend/.env" />
          </>
        )}
        <Fact label="Schema" value={s.currentSchema ?? s.schema} />
        <Fact label="SSL" value={s.sslMode ?? (s.jdbcUrl?.includes('sslmode=') ? s.jdbcUrl.split('sslmode=')[1].split('&')[0] : 'driver default')} />
        <Fact label="PostgreSQL" value={s.serverVersion} />
        <Fact label="Schema version" value={s.schemaVersion ? `V${s.schemaVersion}` : undefined} />
        <Fact
          label="Connections in use"
          value={s.totalConnections != null ? `${s.activeConnections ?? 0} of ${s.totalConnections} open (max ${s.maxConnections})` : undefined}
        />
        {fromPanel && <Fact label="Changed" value={s.savedAt ? `${formatDateTime(s.savedAt)}${s.savedBy ? ` by ${s.savedBy}` : ''}` : undefined} />}
      </dl>
    </Card>
  );
}

function ConnectDatabase({ status, onSwitched }: { status: DatabaseStatus; onSwitched: (r: DatabaseSwitchResult) => void }) {
  const test = useTestDatabase();
  const switcher = useSwitchDatabase();
  const savedConnection = status.source === 'ADMIN_PANEL';
  const [form, setForm] = useState<DatabaseConnectionPayload>(EMPTY);
  const [uri, setUri] = useState('');
  const [uriNote, setUriNote] = useState<{ tone: 'info' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testError, setTestError] = useState<string | null>(null);
  const [tested, setTested] = useState<DatabaseTestResult | null>(null);
  const [copyData, setCopyData] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    if (savedConnection && status.host) {
      setForm({
        host: status.host,
        port: status.port ?? 5432,
        database: status.database ?? 'postgres',
        username: status.username ?? 'postgres',
        password: '',
        schema: status.schema ?? '',
        sslMode: status.sslMode ?? 'require',
      });
    }
  }, [savedConnection, status.host, status.port, status.database, status.username, status.schema, status.sslMode]);

  const set = <K extends keyof DatabaseConnectionPayload>(key: K, value: DatabaseConnectionPayload[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTested(null); // a test only counts for the exact values tested
  };

  const applyUri = (text: string) => {
    setUri(text);
    if (!text.trim()) {
      setUriNote(null);
      return;
    }
    const parsed = parseConnectionString(text);
    if (!parsed) {
      setUriNote({ tone: 'error', text: 'This does not look like a connection string. It should start with postgresql://' });
      return;
    }
    setForm((f) => ({ ...f, ...parsed, password: parsed.password ?? '' }));
    setTested(null);
    setUriNote({
      tone: 'info',
      text: parsed.password ? 'Fields filled in from the connection string.' : 'Fields filled in. Now type the database password below.',
    });
  };

  const payload = (): DatabaseConnectionPayload => ({ ...form, host: form.host.trim(), port: Number(form.port) || 0 });

  const runTest = async () => {
    setErrors({});
    setTestError(null);
    setTested(null);
    try {
      const res = await test.mutateAsync(payload());
      setTested(res);
      setCopyData(!((res.patients ?? 0) > 0 || (res.appointments ?? 0) > 0));
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(parsed.fieldErrors);
      setTestError(parsed.message);
    }
  };

  const runSwitch = async () => {
    setSwitchError(null);
    try {
      const res = await switcher.mutateAsync({ connection: payload(), copyData, currentPassword });
      setConfirming(false);
      setCurrentPassword('');
      setTested(null);
      setForm((f) => ({ ...f, password: '' }));
      onSwitched(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const parsed = parseApiError(err);
      setSwitchError(parsed.fieldErrors.currentPassword ?? parsed.message);
    }
  };

  const canSwitch = tested !== null && tested.errors.length === 0;
  const hasData = (tested?.patients ?? 0) > 0 || (tested?.appointments ?? 0) > 0;

  return (
    <Card
      icon={<PlugZap className="size-5" aria-hidden />}
      title="Connect a database"
      description="Move the app to another PostgreSQL database, for example Supabase. The tables are created automatically."
    >
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Input
            label="Paste a connection string"
            optional
            placeholder="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres"
            value={uri}
            onChange={(e) => applyUri(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            hint="Fills in the fields below. Nothing is sent until you press Test connection."
          />
          {uriNote && (
            <p className={cn('-mt-3 flex items-center gap-1.5 text-sm', uriNote.tone === 'error' ? 'text-red-600' : 'text-brand-700')}>
              <ClipboardPaste className="size-3.5" aria-hidden /> {uriNote.text}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-4">
            <Input label="Host" required wrapperClassName="sm:col-span-3" placeholder="db.xxxx.supabase.co" value={form.host}
              onChange={(e) => set('host', e.target.value.trim())} error={errors.host} autoComplete="off" spellCheck={false} />
            <Input label="Port" required inputMode="numeric" value={String(form.port)}
              onChange={(e) => set('port', Number(e.target.value.replace(/\D/g, '')) || 0)} error={errors.port} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Database" required value={form.database} onChange={(e) => set('database', e.target.value.trim())}
              error={errors.database} autoComplete="off" />
            <Input label="User" required value={form.username} onChange={(e) => set('username', e.target.value.trim())}
              error={errors.username} autoComplete="off" hint="For the Supabase pooler: postgres.<project-ref>" />
          </div>
          <Input
            label="Database password"
            required={!savedConnection}
            type="password"
            autoComplete="new-password"
            placeholder={savedConnection ? 'Leave empty to keep the saved password' : 'The password you set when creating the project'}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password}
            hint="Saved on the server only and never shown again."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Schema" optional value={form.schema} onChange={(e) => set('schema', e.target.value.trim().toLowerCase())}
              error={errors.schema} placeholder="dental_clinic"
              hint="A separate schema keeps clinic tables out of Supabase's public API. Created if missing." />
            <Select label="SSL" required value={form.sslMode} onChange={(e) => set('sslMode', e.target.value as SslMode)} error={errors.sslMode}>
              {SSL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          <Button variant="outline" loading={test.isPending} disabled={!form.host} onClick={runTest}
            icon={<PlugZap className="size-4" aria-hidden />}>
            Test connection
          </Button>

          <AnimatePresence>
            {testError && <Alert tone="error">{testError}</Alert>}
          </AnimatePresence>
          {tested && <TestSummary result={tested} schema={form.schema || 'public'} />}

          {canSwitch && (
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-ink">Switch the app to this database</h3>
              <Checkbox
                label={
                  <>
                    <b>Copy all data from the current database</b> (patients, appointments, doctors, website content, admin
                    accounts, settings).{' '}
                    {hasData ? 'This replaces the clinic data already in the new database.' : 'Recommended when moving to a new database.'}
                  </>
                }
                checked={copyData}
                onChange={(e) => setCopyData(e.target.checked)}
              />
              {!copyData && (
                <p className="text-sm text-slate-500">
                  The new database keeps its own data. If it has no admin accounts yet, your account is added so you can sign in.
                </p>
              )}
              <Button icon={<ArrowLeftRight className="size-4" aria-hidden />} onClick={() => { setSwitchError(null); setConfirming(true); }}>
                Switch database…
              </Button>
            </div>
          )}
        </div>

        <SupabaseHelp />
      </div>

      <ConfirmSwitch
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Switch database?"
        description={`${form.username}@${form.host}:${form.port}/${form.database}${form.schema ? `, schema ${form.schema}` : ''}`}
        copyData={copyData}
        password={currentPassword}
        onPassword={setCurrentPassword}
        error={switchError}
        loading={switcher.isPending}
        onConfirm={runSwitch}
      />
    </Card>
  );
}

function TestSummary({ result: r, schema }: { result: DatabaseTestResult; schema: string }) {
  const ok = r.errors.length === 0;
  return (
    <div className="space-y-3">
      <Alert tone={ok ? 'success' : 'error'} title={ok ? 'Connection works' : 'Connected, but this database cannot be used yet'}>
        <ul className="list-disc space-y-1 pl-4">
          <li>PostgreSQL {r.serverVersion}, database {r.database}</li>
          <li>
            {r.schemaWillBeCreated
              ? `Schema "${schema}" will be created with all clinic tables.`
              : r.schemaVersion
                ? `Schema "${schema}" already has clinic tables (version V${r.schemaVersion}).`
                : `Clinic tables will be created in schema "${schema}".`}
            {r.pendingMigrations > 0 && r.schemaVersion ? ` ${r.pendingMigrations} update(s) will be applied.` : ''}
          </li>
          {r.schemaVersion && (
            <li>
              Already contains {r.patients ?? 0} patients, {r.appointments ?? 0} appointments, {r.doctors ?? 0} doctors and {r.admins ?? 0} admin
              account(s).
            </li>
          )}
          {r.errors.map((e) => <li key={e}><b>{e}</b></li>)}
        </ul>
      </Alert>
      {r.warnings.map((w) => (
        <Alert key={w} tone="warning">{w}</Alert>
      ))}
    </div>
  );
}

function ConfirmSwitch({
  open, onClose, title, description, copyData, password, onPassword, error, loading, onConfirm,
}: {
  open: boolean; onClose: () => void; title: string; description: string; copyData: boolean; password: string;
  onPassword: (v: string) => void; error: string | null; loading: boolean; onConfirm: () => void;
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
          <Button onClick={onConfirm} loading={loading} disabled={!password}>
            {loading ? (copyData ? 'Copying data…' : 'Switching…') : 'Switch now'}
          </Button>
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
          <li>New requests use the new database as soon as the switch finishes. The current database is not changed or deleted.</li>
          {copyData ? (
            <li>All clinic data is copied across. Anything saved while the copy runs may be missed, so do this when the clinic is quiet.</li>
          ) : (
            <li>No data is copied. You will need to sign in again.</li>
          )}
          <li>If anything fails, the app stays on the current database.</li>
        </ul>
        <Input label="Your admin password" type="password" autoComplete="current-password" required value={password}
          onChange={(e) => onPassword(e.target.value)} error={error ?? undefined} autoFocus />
      </form>
    </Modal>
  );
}

function BackToEnvironment({ status, onSwitched }: { status: DatabaseStatus; onSwitched: (r: DatabaseSwitchResult) => void }) {
  const mutation = useUseEnvironmentDatabase();
  const [open, setOpen] = useState(false);
  const [copyData, setCopyData] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    try {
      const res = await mutation.mutateAsync({ copyData, currentPassword: password });
      setOpen(false);
      setPassword('');
      onSwitched(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.fieldErrors.currentPassword ?? parsed.message);
    }
  };

  return (
    <Card
      icon={<RotateCcw className="size-5" aria-hidden />}
      title="Go back to the backend/.env database"
      description="Stop using the database set on this page and use the DB_* values from the server's backend/.env file again."
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          That database is <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs break-all">{status.environmentJdbcUrl}</code>
        </p>
        <Checkbox label="Copy all current data to it (replaces its clinic data)" checked={copyData} onChange={(e) => setCopyData(e.target.checked)} />
        <Button variant="outline" onClick={() => { setError(null); setOpen(true); }} icon={<RotateCcw className="size-4" aria-hidden />}>
          Use the backend/.env database…
        </Button>
      </div>
      <ConfirmSwitch
        open={open}
        onClose={() => setOpen(false)}
        title="Go back to the backend/.env database?"
        description={status.environmentJdbcUrl ?? ''}
        copyData={copyData}
        password={password}
        onPassword={setPassword}
        error={error}
        loading={mutation.isPending}
        onConfirm={run}
      />
    </Card>
  );
}

function SupabaseHelp() {
  return (
    <aside className="h-fit rounded-2xl bg-slate-50 p-5 text-sm text-slate-600 dark:bg-white/[0.03]">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink"><KeyRound className="size-4" aria-hidden /> Using Supabase</h3>
      <ol className="list-decimal space-y-2.5 pl-4">
        <li>In your Supabase project, click <b>Connect</b> and choose <b>Session pooler</b> (port 5432).</li>
        <li>
          Copy the URI and paste it above. The Session pooler works over IPv4; the <b>Direct connection</b> only works if this
          server has IPv6. Avoid the Transaction pooler.
        </li>
        <li>Type your database password. Forgot it? Reset it under <b>Project Settings → Database</b>.</li>
        <li>Press <b>Test connection</b>, keep <b>Copy all data</b> ticked, then switch.</li>
      </ol>
      <p className="mt-4 text-xs text-slate-500">
        The connection is saved on the server in the file shown in the config (db-connection.json) and is used after restarts. Delete that file to go back to backend/.env.
      </p>
    </aside>
  );
}
