import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { NavigationItem } from '../../../types';
import { useAdminNavigation, useSaveNavigation } from '../../../hooks/useAdminData';
import { getErrorMessage, parseApiError } from '../../../utils/errors';
import { Input } from '../../ui/FormField';
import { Button } from '../../ui/Button';
import { Alert, ErrorMessage } from '../../ui/Alert';
import { Skeleton } from '../../ui/Spinner';

/** Header menu editor (order = position in the list). The footer "Explore" links use the same menu. */
export function NavigationEditor() {
  const { data, isLoading, isError, error, refetch } = useAdminNavigation();
  const save = useSaveNavigation();
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (data) setItems(data); }, [data]);

  const update = (i: number, patch: Partial<NavigationItem>) => { setItems((list) => list.map((it, idx) => (idx === i ? { ...it, ...patch } : it))); setSaved(false); };
  const move = (i: number, dir: -1 | 1) => setItems((list) => { const next = [...list]; [next[i], next[i + dir]] = [next[i + dir], next[i]]; return next; });

  if (isLoading) return <Skeleton className="h-48" />;
  if (isError) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {save.isError && <Alert tone="error">{parseApiError(save.error).message}</Alert>}
      {saved && <Alert tone="success">Menu saved.</Alert>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id ?? `new-${i}`} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1.5fr_auto_auto] sm:items-end">
            <Input label="Label" value={item.label} onChange={(e) => update(i, { label: e.target.value })} />
            <Input label="Link" placeholder="/about or https://..." value={item.url} onChange={(e) => update(i, { url: e.target.value })} />
            <div className="flex gap-4 pb-2 text-sm text-slate-600">
              <label className="inline-flex items-center gap-1.5"><input type="checkbox" className="accent-brand-700" checked={item.active} onChange={(e) => update(i, { active: e.target.checked })} />Show</label>
              <label className="inline-flex items-center gap-1.5"><input type="checkbox" className="accent-brand-700" checked={item.openInNewTab} onChange={(e) => update(i, { openInNewTab: e.target.checked })} />New tab</label>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" aria-label="Move up" disabled={i === 0} icon={<ArrowUp className="size-4" />} onClick={() => move(i, -1)} />
              <Button size="sm" variant="ghost" aria-label="Move down" disabled={i === items.length - 1} icon={<ArrowDown className="size-4" />} onClick={() => move(i, 1)} />
              <Button size="sm" variant="ghostDanger" aria-label="Remove" icon={<Trash2 className="size-4" />} onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" icon={<Plus className="size-4" aria-hidden />} onClick={() => setItems((l) => [...l, { label: '', url: '/', active: true, openInNewTab: false }])}>Add menu item</Button>
        <Button loading={save.isPending} onClick={async () => {
          try { await save.mutateAsync(items.map((it, i) => ({ ...it, displayOrder: i + 1 }))); setSaved(true); } catch { /* shown above */ }
        }}>Save menu</Button>
      </div>
    </div>
  );
}
