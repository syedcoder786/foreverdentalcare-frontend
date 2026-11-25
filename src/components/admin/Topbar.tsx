import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { admin } = useAuth();
  const initials = (admin?.name ?? 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-surface/80 px-4 backdrop-blur-xl sm:px-6 dark:border-white/5">
      <button type="button" onClick={onMenu} className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
        <Menu className="size-5" />
      </button>
      <h1 className="truncate text-lg font-semibold text-ink">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="hidden text-right text-sm sm:block">
          <p className="font-medium text-ink">{admin?.name}</p>
          <p className="text-xs text-slate-500">{admin?.email}</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800" aria-hidden>
          {initials}
        </span>
      </div>
    </header>
  );
}
