import { motion } from 'motion/react';
import type { DayOfWeek } from '../../types';
import { DAYS_ORDER, DAY_LABELS, formatTime } from '../../utils/format';
import { clinicDay, shiftsOf, type HoursLike } from '../../utils/clinicHours';
import { ShiftIcon, type TileKey } from '../ui/ShiftHours';
import { EASE_OUT } from '../motion/Reveal';
import { cn } from '../../utils/cn';

/** One block of time to show: a doctor's shift, the clinic's open hours, or a break. */
export interface HoursTile {
  kind: TileKey;
  label: string;
  from: string;
  to: string;
}

/** Doctor hours as tiles: Morning shift / Evening shift (or a single shift). */
export const shiftTiles = (h: HoursLike): HoursTile[] => shiftsOf(h).map((s) => ({ kind: s.key, label: s.label, from: s.from, to: s.to }));

/** Clinic hours as tiles: Open (opening - closing) plus the break, if any. */
export function clinicTiles(h: HoursLike): HoursTile[] {
  const d = clinicDay(h);
  if (!d) return [];
  const tiles: HoursTile[] = [{ kind: 'full', label: 'Open', from: d.open, to: d.close }];
  if (d.break) tiles.push({ kind: 'break', label: 'Break', from: d.break.from, to: d.break.to });
  return tiles;
}

export interface DayTiles {
  day: DayOfWeek;
  /** null or empty = closed / day off. */
  tiles: HoursTile[] | null;
}

interface Group {
  key: string;
  days: DayOfWeek[];
  tiles: HoursTile[];
}

const tilesKey = (tiles: HoursTile[]) => tiles.map((t) => `${t.kind}:${t.from}-${t.to}`).join('|');

/** Days with identical hours are shown once ("Mon – Sat"); open groups first in week order, days off last. */
function groupDays(days: DayTiles[]): Group[] {
  const groups = new Map<string, Group>();
  for (const day of DAYS_ORDER) {
    const tiles = days.find((d) => d.day === day)?.tiles ?? [];
    const key = tiles.length ? tilesKey(tiles) : 'closed';
    const g = groups.get(key) ?? { key, days: [], tiles };
    g.days.push(day);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => (a.key === 'closed' ? 1 : b.key === 'closed' ? -1 : DAYS_ORDER.indexOf(a.days[0]) - DAYS_ORDER.indexOf(b.days[0])));
}

/** "Mon – Sat", "Mon – Wed, Fri", "Sunday". */
export function dayRangeLabel(days: DayOfWeek[]): string {
  if (days.length === 1) return DAY_LABELS[days[0]].long;
  const runs: DayOfWeek[][] = [];
  for (const d of days) {
    const last = runs[runs.length - 1];
    if (last && DAYS_ORDER.indexOf(d) === DAYS_ORDER.indexOf(last[last.length - 1]) + 1) last.push(d);
    else runs.push([d]);
  }
  return runs
    .map((r) => (r.length >= 3 ? `${DAY_LABELS[r[0]].short} – ${DAY_LABELS[r[r.length - 1]].short}` : r.map((d) => DAY_LABELS[d].short).join(', ')))
    .join(', ');
}

/** "10:00 AM" with the AM/PM styled smaller. */
export function TimeText({ time, className }: { time: string; className?: string }) {
  const [clock, meridiem] = formatTime(time).split(' ');
  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      {clock}
      <span className="ml-0.5 text-[0.7em] font-semibold tracking-wide opacity-70">{meridiem}</span>
    </span>
  );
}

const TILE_TONE: Record<TileKey, string> = {
  morning: 'bg-gradient-to-br from-amber-50 to-orange-50/40 ring-amber-200/60 dark:from-amber-400/[0.08] dark:to-orange-400/[0.03] dark:ring-amber-300/15',
  evening: 'bg-gradient-to-br from-indigo-50 to-violet-50/40 ring-indigo-200/60 dark:from-indigo-400/[0.09] dark:to-violet-400/[0.03] dark:ring-indigo-300/15',
  full: 'bg-gradient-to-br from-brand-50 to-sky-soft-50/40 ring-brand-200/60 dark:from-brand-400/[0.08] dark:to-sky-soft-400/[0.03] dark:ring-brand-300/15',
  break: 'bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgb(148_163_184/0.08)_8px,rgb(148_163_184/0.08)_16px)] ring-slate-200 dark:ring-white/10',
};
const ICON_TONE: Record<TileKey, string> = {
  morning: 'bg-amber-100 dark:bg-amber-400/15',
  evening: 'bg-indigo-100 dark:bg-indigo-400/15',
  full: 'bg-brand-100 dark:bg-brand-400/15',
  break: 'bg-slate-100 dark:bg-white/[0.06]',
};

function Tile({ tile, compact }: { tile: HoursTile; compact?: boolean }) {
  const isBreak = tile.kind === 'break';
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl ring-1', TILE_TONE[tile.kind], compact ? 'px-3 py-2.5' : 'p-4')}>
      <span className={cn('flex shrink-0 items-center justify-center rounded-xl', ICON_TONE[tile.kind], compact ? 'size-8' : 'size-10')}>
        <ShiftIcon shift={{ key: tile.kind }} className={compact ? 'size-4' : 'size-5'} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{tile.label}</p>
        <p className={cn('mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-semibold', isBreak ? 'text-muted' : 'text-ink', compact || isBreak ? 'text-sm' : 'text-base sm:text-lg')}>
          <TimeText time={tile.from} />
          <span className="font-normal text-muted">–</span>
          <TimeText time={tile.to} />
        </p>
      </div>
    </div>
  );
}

/** Seven day pills; open days tinted, today ringed. */
export function WeekStrip({ days, today, className }: { days: DayTiles[]; today?: DayOfWeek; className?: string }) {
  return (
    <div className={cn('grid grid-cols-7 gap-1', className)} aria-hidden>
      {DAYS_ORDER.map((day) => {
        const open = !!days.find((d) => d.day === day)?.tiles?.length;
        const isToday = day === today;
        return (
          <span
            key={day}
            className={cn(
              'relative flex min-w-0 flex-col items-center rounded-xl py-2 text-[11px] font-semibold',
              open ? 'bg-brand-50 text-brand-800 dark:bg-brand-400/10 dark:text-brand-200' : 'bg-slate-100/70 text-slate-400 dark:bg-white/[0.03] dark:text-slate-500',
              isToday && 'ring-2 ring-brand-500 ring-offset-2 ring-offset-surface dark:ring-brand-400',
            )}
          >
            {DAY_LABELS[day].short}
            <span className={cn('mt-1 size-1.5 rounded-full', open ? 'bg-brand-500 dark:bg-brand-400' : 'bg-slate-300 dark:bg-white/15')} />
          </span>
        );
      })}
    </div>
  );
}

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const SEGMENT: Record<TileKey, string> = {
  morning: 'from-amber-300 to-orange-400',
  evening: 'from-indigo-400 to-violet-500',
  full: 'from-brand-400 to-sky-soft-500',
  break: 'from-slate-300 to-slate-400',
};

export interface TimelineSegment {
  kind: TileKey;
  from: string;
  to: string;
}

/** Clinic day as timeline segments: open time, split around the break. */
export function clinicSegments(h: HoursLike): TimelineSegment[] {
  const d = clinicDay(h);
  if (!d) return [];
  if (!d.break) return [{ kind: 'full', from: d.open, to: d.close }];
  return [
    { kind: 'full', from: d.open, to: d.break.from },
    { kind: 'full', from: d.break.to, to: d.close },
  ];
}

/** A day bar: coloured segments, hatched gaps (labelled, e.g. "Break") and a live "now" marker. */
export function DayTimeline({ segments, now, gapLabel, className }: { segments: TimelineSegment[]; now?: string; gapLabel?: string; className?: string }) {
  if (!segments.length) return null;
  const start = Math.max(0, Math.floor(toMin(segments[0].from) / 60) * 60 - 60);
  const end = Math.min(24 * 60, Math.ceil(toMin(segments[segments.length - 1].to) / 60) * 60 + 60);
  const pct = (m: number) => ((m - start) / (end - start)) * 100;
  const nowMin = now ? toMin(now) : null;
  const showNow = nowMin != null && nowMin >= start && nowMin <= end;
  const gaps = segments.slice(1).map((s, i) => ({ from: segments[i].to, to: s.from }));
  return (
    <div className={className}>
      <div className="relative h-3 rounded-full bg-slate-100 dark:bg-white/[0.06]">
        {gaps.map((g) => (
          <span
            key={g.from}
            className="absolute inset-y-0 rounded-full bg-[repeating-linear-gradient(135deg,transparent,transparent_4px,rgb(148_163_184/0.35)_4px,rgb(148_163_184/0.35)_8px)]"
            style={{ left: `${pct(toMin(g.from))}%`, width: `${pct(toMin(g.to)) - pct(toMin(g.from))}%` }}
          >
            {gapLabel && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-wide whitespace-nowrap text-muted uppercase">{gapLabel}</span>
            )}
          </span>
        ))}
        {segments.map((s, i) => (
          <motion.span
            key={`${s.from}-${s.to}`}
            className={cn('absolute inset-y-0 origin-left rounded-full bg-gradient-to-r', SEGMENT[s.kind])}
            style={{ left: `${pct(toMin(s.from))}%`, width: `${pct(toMin(s.to)) - pct(toMin(s.from))}%` }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 + i * 0.2, ease: EASE_OUT }}
          />
        ))}
        {showNow && (
          <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct(nowMin)}%` }} title="Now">
            <span className="absolute -inset-1.5 animate-ping rounded-full bg-ink/20" />
            <span className="relative block size-4 rounded-full border-[3px] border-surface bg-ink shadow" />
          </span>
        )}
      </div>
      <div className="relative mt-2 h-4 text-[10px] font-medium text-muted">
        {segments.flatMap((s) => [s.from, s.to]).map((t, i) => (
          <span
            key={`${t}-${i}`}
            // Starts hang right of their mark, ends hang left, so labels around a short gap never overlap.
            className={cn('absolute whitespace-nowrap', i % 2 === 1 && '-translate-x-full')}
            style={{ left: `${pct(toMin(t))}%` }}
          >
            {formatTime(t).replace(':00', '')}
          </span>
        ))}
      </div>
    </div>
  );
}

interface WeeklyHoursProps {
  days: DayTiles[];
  today?: DayOfWeek;
  /** Narrow layout (sidebars): tiles stacked. */
  compact?: boolean;
  closedLabel?: string;
  className?: string;
}

/** Week overview: day strip, then each group of days with the same hours. */
export function WeeklyHours({ days, today, compact, closedLabel = 'Closed', className }: WeeklyHoursProps) {
  const groups = groupDays(days);
  const open = groups.filter((g) => g.key !== 'closed');
  const closed = groups.find((g) => g.key === 'closed');

  return (
    <div className={cn('space-y-5', className)}>
      <WeekStrip days={days} today={today} />
      {open.length === 0 && <p className="text-sm text-muted">No timings set yet.</p>}
      {open.map((g, gi) => {
        const isToday = !!today && g.days.includes(today);
        return (
          <motion.div
            key={g.key}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: gi * 0.08, ease: EASE_OUT }}
          >
            <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink">
              {dayRangeLabel(g.days)}
              {isToday && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 uppercase ring-1 ring-brand-100 dark:bg-brand-400/10 dark:text-brand-300 dark:ring-brand-400/20">
                  Today
                </span>
              )}
            </p>
            <div className={cn('grid gap-2.5', compact || g.tiles.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
              {g.tiles.map((t) => (
                <Tile key={`${t.kind}-${t.from}`} tile={t} compact={compact} />
              ))}
            </div>
          </motion.div>
        );
      })}
      {closed && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm dark:border-white/10">
          <span className="font-medium text-ink">{dayRangeLabel(closed.days)}</span>
          <span className="text-muted">{closedLabel}</span>
        </div>
      )}
    </div>
  );
}
