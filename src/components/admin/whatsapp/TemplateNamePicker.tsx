import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { WhatsAppTemplateName } from '../../../types';
import { useAddTemplateName, useDeleteTemplateName, useTemplateNames } from '../../../hooks/useAdminData';
import { getErrorMessage, parseApiError } from '../../../utils/errors';
import { Input, Select } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';

const ADD_NEW = '__add__';
export const templateKey = (name?: string | null, language?: string | null) => (name ? `${name}|${language || 'en_US'}` : '');

/** Form to save a template name (exactly as created in WhatsApp Manager) for reuse. */
export function AddTemplateNameForm({ onAdded, onCancel }: { onAdded?: (n: WhatsAppTemplateName) => void; onCancel?: () => void }) {
  const add = useAddTemplateName();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    setErrors({});
    try {
      const saved = await add.mutateAsync({ name: name.trim(), language: language.trim() || 'en_US' });
      setName('');
      onAdded?.(saved);
    } catch (err) {
      const parsed = parseApiError(err);
      setErrors(Object.keys(parsed.fieldErrors).length ? parsed.fieldErrors : { name: parsed.message });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_9rem_auto] sm:items-start dark:bg-white/[0.03]">
      <Input
        label="Template name"
        required
        placeholder="e.g. appointment_confirmed"
        value={name}
        onChange={(e) => setName(e.target.value.trim())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
        error={errors.name}
        hint="Exactly as it appears in WhatsApp Manager."
      />
      <Input label="Language" required placeholder="en_US" value={language} onChange={(e) => setLanguage(e.target.value.trim())} error={errors.language} />
      <div className="flex gap-2 sm:pt-7">
        <Button onClick={submit} loading={add.isPending} disabled={!name} icon={<Plus className="size-4" aria-hidden />}>Add</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}

/** Choose one of the saved template names, or add a new one inline. Value is "name|language". */
export function TemplateNamePicker({ value, onChange, error }: { value: string; onChange: (key: string) => void; error?: string }) {
  const names = useTemplateNames();
  const [adding, setAdding] = useState(false);
  const list = names.data ?? [];
  const known = list.some((n) => templateKey(n.name, n.language) === value);

  return (
    <div className="space-y-3">
      <Select
        label="Template name"
        required
        value={adding ? ADD_NEW : value}
        onChange={(e) => {
          if (e.target.value === ADD_NEW) {
            setAdding(true);
          } else {
            setAdding(false);
            onChange(e.target.value);
          }
        }}
        error={error}
        hint={names.isLoading ? 'Loading saved template names…' : list.length === 0 ? 'No template names saved yet. Add one.' : undefined}
      >
        <option value="">Choose a template name…</option>
        {list.map((n) => (
          <option key={n.id} value={templateKey(n.name, n.language)}>{n.name} ({n.language})</option>
        ))}
        {value && !known && !names.isLoading && <option value={value}>{value.replace('|', ' (')}) · not in saved names</option>}
        <option value={ADD_NEW}>+ Add a new template name…</option>
      </Select>
      {adding && (
        <AddTemplateNameForm
          onAdded={(n) => {
            setAdding(false);
            onChange(templateKey(n.name, n.language));
          }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}

/** The saved list, where names can be added and removed. */
export function TemplateNameLibrary() {
  const names = useTemplateNames();
  const remove = useDeleteTemplateName();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft sm:p-6 dark:border-white/10">
      <div>
        <h2 className="font-semibold text-ink">Template names</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Create templates in WhatsApp Manager, then save their names here. Saved names can be reused for appointment messages and marketing.
        </p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <AddTemplateNameForm />
      {names.isError ? (
        <Alert tone="error">{getErrorMessage(names.error)}</Alert>
      ) : (names.data ?? []).length === 0 ? (
        <p className="text-sm text-slate-500">{names.isLoading ? 'Loading…' : 'No template names saved yet.'}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/5">
          {(names.data ?? []).map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <span className="font-mono text-sm text-ink">{n.name}</span>
                <span className="ml-2 text-xs text-slate-500">{n.language}</span>
                {n.inUse && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">In use</span>}
              </div>
              <Button
                variant="ghostDanger"
                size="sm"
                disabled={n.inUse}
                title={n.inUse ? 'Used by a message. Change that message first.' : undefined}
                icon={<Trash2 className="size-4" aria-hidden />}
                onClick={() => {
                  setError(null);
                  if (window.confirm(`Remove "${n.name}" from saved names?`)) {
                    remove.mutate(n.id, { onError: (err) => setError(getErrorMessage(err)) });
                  }
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
