import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { PageKey, Section, SectionItem } from '../../../types';
import { useDeleteSection, useSaveSection } from '../../../hooks/useAdminData';
import { parseApiError } from '../../../utils/errors';
import { Checkbox, Input, Select, Textarea } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/Alert';
import { ImageUpload } from '../ImageUpload';
import { ICONS } from '../../content/CmsIcon';
import { cn } from '../../../utils/cn';
import { toast } from '../../ui/Toast';

/** Human labels for built-in sections, with what each field controls. */
const SECTION_INFO: Record<string, { label: string; help?: string; items?: string; noItems?: boolean }> = {
  hero: { label: 'Hero (top banner)', help: 'Title = main heading (last two words are highlighted). Subtitle = small badge. Body = description. Image = hero photo.', items: 'Highlights (title only)' },
  intro: { label: 'Introduction', noItems: true },
  doctors: { label: 'Featured doctors', help: 'Doctors marked "Featured" in their profile appear here.', noItems: true },
  specialties: { label: 'Specialties', noItems: true },
  services: { label: 'Featured treatments', help: 'Shows the first 6 active treatments by display order.', noItems: true },
  why_choose_us: { label: 'Why choose us', items: 'Feature cards' },
  testimonials: { label: 'Testimonials', help: 'Published testimonials are managed in Admin -> Testimonials. Hidden when none are published.', noItems: true },
  gallery: { label: 'Gallery preview', help: 'Shows the first 6 gallery images. Hidden when the gallery is empty.', noItems: true },
  timings: { label: 'Clinic timings', noItems: true },
  cta: { label: 'Call-to-action banner', noItems: true },
  mission: { label: 'Mission', noItems: true },
  vision: { label: 'Vision', noItems: true },
  facilities: { label: 'Facilities', items: 'Facility cards (add photos)' },
  equipment: { label: 'Equipment', items: 'Equipment cards' },
  consent: { label: 'Booking consent text', help: 'Body = the consent sentence patients must accept.', noItems: true },
  emergency: { label: 'Emergency note', noItems: true },
};

export function SectionEditor({ section, pageKey }: { section: Section; pageKey: PageKey }) {
  const info = SECTION_INFO[section.sectionKey] ?? (section.core ? { label: section.sectionKey } : { label: `Custom: ${section.sectionKey}`, items: 'Cards' });
  const save = useSaveSection(pageKey);
  const remove = useDeleteSection();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Section>(section);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(section), [section]);
  const set = <K extends keyof Section>(key: K, value: Section[K]) => { setDraft((d) => ({ ...d, [key]: value })); setSaved(false); };
  const setItem = (i: number, patch: Partial<SectionItem>) => set('items', draft.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const fieldError = (f: string) => (save.isError ? parseApiError(save.error).fieldErrors[f] : undefined);

  const submit = async (overrides?: Partial<Section>) => {
    const d = { ...draft, ...overrides };
    try {
      await save.mutateAsync({
        id: section.id,
        payload: {
          title: d.title ?? '', subtitle: d.subtitle ?? '', body: d.body ?? '', imageUrl: d.imageUrl ?? '',
          primaryButtonLabel: d.primaryButtonLabel ?? '', primaryButtonUrl: d.primaryButtonUrl ?? '',
          secondaryButtonLabel: d.secondaryButtonLabel ?? '', secondaryButtonUrl: d.secondaryButtonUrl ?? '',
          items: d.items, displayOrder: Number(d.displayOrder), active: d.active,
        },
      });
      setSaved(true);
      toast.success(overrides?.active !== undefined ? (overrides.active ? 'Section is now visible.' : 'Section hidden.') : 'Saved. The website now shows the new content.');
    } catch { /* shown below */ }
  };

  return (
    <div className={cn('rounded-2xl border bg-surface transition-colors', open ? 'border-brand-200 shadow-soft' : 'border-slate-200')}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
          <ChevronDown className={cn('size-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} aria-hidden />
          <span className="min-w-0">
            <span className="block font-medium text-ink">{info.label}</span>
            <span className="block truncate text-xs text-slate-500">{section.title || section.body || 'No text yet'}</span>
          </span>
        </button>
        <span className="hidden text-xs text-slate-400 sm:inline">Order {section.displayOrder}</span>
        <Button size="sm" variant="ghost" aria-label={section.active ? 'Hide section' : 'Show section'} icon={section.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          onClick={() => submit({ active: !section.active })} title={section.active ? 'Visible - click to hide' : 'Hidden - click to show'}>
          <span className="hidden sm:inline">{section.active ? 'Visible' : 'Hidden'}</span>
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
              {info.help && <p className="rounded-xl bg-sky-soft-50 p-3 text-xs text-sky-soft-700">{info.help}</p>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Title" value={draft.title ?? ''} onChange={(e) => set('title', e.target.value)} error={fieldError('title')} />
                <Input label="Subtitle / eyebrow" value={draft.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
              </div>
              <Textarea label="Body text" rows={4} hint="Blank lines separate paragraphs." value={draft.body ?? ''} onChange={(e) => set('body', e.target.value)} error={fieldError('body')} />
              {!info.noItems || section.sectionKey === 'intro' || section.sectionKey === 'hero' ? (
                <ImageUpload label="Image" value={draft.imageUrl} onChange={(url) => set('imageUrl', url)} error={fieldError('imageUrl')} />
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Primary button text" value={draft.primaryButtonLabel ?? ''} onChange={(e) => set('primaryButtonLabel', e.target.value)} />
                <Input label="Primary button link" placeholder="/book" value={draft.primaryButtonUrl ?? ''} onChange={(e) => set('primaryButtonUrl', e.target.value)} error={fieldError('primaryButtonUrl')} />
                <Input label="Secondary button text" value={draft.secondaryButtonLabel ?? ''} onChange={(e) => set('secondaryButtonLabel', e.target.value)} />
                <Input label="Secondary button link" placeholder="/doctors" value={draft.secondaryButtonUrl ?? ''} onChange={(e) => set('secondaryButtonUrl', e.target.value)} error={fieldError('secondaryButtonUrl')} />
              </div>

              {!info.noItems && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-ink">{info.items ?? 'Cards'}</h4>
                    <Button size="sm" variant="outline" icon={<Plus className="size-4" aria-hidden />} onClick={() => set('items', [...draft.items, { title: '' }])}>Add</Button>
                  </div>
                  {draft.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 lg:grid-cols-[1fr_2fr_auto]">
                      <div className="space-y-3">
                        <Input label="Title" value={item.title ?? ''} onChange={(e) => setItem(i, { title: e.target.value })} />
                        {section.sectionKey !== 'hero' && (
                          <Select label="Icon" value={item.icon ?? ''} onChange={(e) => setItem(i, { icon: e.target.value })}>
                            <option value="">None</option>
                            {Object.entries(ICONS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
                          </Select>
                        )}
                      </div>
                      {section.sectionKey !== 'hero' ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Textarea label="Text" rows={4} value={item.text ?? ''} onChange={(e) => setItem(i, { text: e.target.value })} />
                          <ImageUpload label="Photo" aspect="wide" value={item.imageUrl} onChange={(url) => setItem(i, { imageUrl: url })} />
                        </div>
                      ) : <div />}
                      <div className="flex gap-1 lg:flex-col">
                        <Button size="sm" variant="ghost" disabled={i === 0} aria-label="Move up" onClick={() => { const it = [...draft.items]; [it[i - 1], it[i]] = [it[i], it[i - 1]]; set('items', it); }}>↑</Button>
                        <Button size="sm" variant="ghost" disabled={i === draft.items.length - 1} aria-label="Move down" onClick={() => { const it = [...draft.items]; [it[i + 1], it[i]] = [it[i], it[i + 1]]; set('items', it); }}>↓</Button>
                        <Button size="sm" variant="ghostDanger" aria-label="Remove card" icon={<Trash2 className="size-4" />} onClick={() => set('items', draft.items.filter((_, idx) => idx !== i))} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
              {saved && <Alert tone="success">Saved. The website now shows the new content.</Alert>}
              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
                <div className="flex items-end gap-4">
                  <Input label="Display order" inputMode="numeric" wrapperClassName="w-28" value={String(draft.displayOrder)} onChange={(e) => set('displayOrder', Number(e.target.value.replace(/\D/g, '') || 0))} />
                  <Checkbox label="Visible on website" checked={draft.active} onChange={(e) => set('active', e.target.checked)} />
                </div>
                <div className="flex gap-2">
                  {!section.core && (
                    <Button variant="ghostDanger" loading={remove.isPending} icon={<Trash2 className="size-4" />} onClick={() => remove.mutate(section.id, { onSuccess: () => toast.success('Section deleted.') })}>Delete section</Button>
                  )}
                  <Button loading={save.isPending} onClick={() => submit()}>Save section</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
