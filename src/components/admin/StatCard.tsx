import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { CountUp } from '../motion/CountUp';

type Tone = 'brand' | 'amber' | 'sky' | 'emerald' | 'slate' | 'violet';

const tones: Record<Tone, { chip: string; glow: string }> = {
  brand: { chip: 'bg-brand-50 text-brand-700 dark:text-brand-300', glow: 'from-brand-400/25' },
  amber: { chip: 'bg-amber-50 text-amber-600 dark:text-amber-700', glow: 'from-amber-400/25' },
  sky: { chip: 'bg-sky-soft-50 text-sky-soft-700', glow: 'from-sky-soft-500/25' },
  emerald: { chip: 'bg-emerald-50 text-emerald-600', glow: 'from-emerald-400/25' },
  slate: { chip: 'bg-slate-100 text-slate-500', glow: 'from-slate-400/20' },
  violet: { chip: 'bg-violet-50 text-violet-600', glow: 'from-violet-400/25' },
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: Tone;
  to?: string;
  hint?: string;
}

export function StatCard({ label, value, icon, tone = 'brand', to, hint }: StatCardProps) {
  const t = tones[tone];
  const body = (
    <>
      {/* Corner glow that brightens on hover */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br to-transparent opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-100',
          t.glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {typeof value === 'number' ? <CountUp value={value} /> : value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <span className={cn('flex size-11 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6', t.chip)}>
          {icon}
        </span>
      </div>
    </>
  );
  const className = 'group relative block overflow-hidden rounded-2xl border border-slate-200 bg-surface p-5 shadow-soft transition-all duration-300';
  return to ? (
    <Link to={to} className={cn(className, 'hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift dark:hover:border-brand-400/30 dark:hover:shadow-glow')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
