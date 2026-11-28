import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title?: string;
  message: ReactNode;
  duration: number;
}

interface ToastOptions {
  title?: string;
  /** Milliseconds before the toast closes itself. 0 keeps it open until dismissed. */
  duration?: number;
}

// Tiny global store so any component (or plain function) can raise a toast without context plumbing.
let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const emit = () => listeners.forEach((l) => l());

function dismiss(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  items = items.filter((t) => t.id !== id);
  emit();
}

const DEFAULT_DURATION: Record<ToastTone, number> = { success: 4000, info: 5000, warning: 8000, error: 7000 };

function show(tone: ToastTone, message: ReactNode, opts: ToastOptions = {}) {
  // Same message already on screen: restart it instead of stacking duplicates.
  const dup = items.find((t) => t.tone === tone && t.message === message);
  if (dup) dismiss(dup.id);
  const id = nextId++;
  const duration = opts.duration ?? DEFAULT_DURATION[tone];
  items = [...items, { id, tone, message, title: opts.title, duration }].slice(-4);
  emit();
  if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration));
  return id;
}

export const toast = {
  success: (message: ReactNode, opts?: ToastOptions) => show('success', message, opts),
  error: (message: ReactNode, opts?: ToastOptions) => show('error', message, opts),
  warning: (message: ReactNode, opts?: ToastOptions) => show('warning', message, opts),
  info: (message: ReactNode, opts?: ToastOptions) => show('info', message, opts),
  show,
  dismiss,
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => items;

const styles: Record<ToastTone, { icon: ReactNode; accent: string; bar: string }> = {
  success: {
    icon: <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />,
    accent: 'bg-emerald-50 ring-emerald-200/70 dark:bg-emerald-500/10 dark:ring-emerald-400/20',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: <XCircle className="size-5 text-red-500" aria-hidden />,
    accent: 'bg-red-50 ring-red-200/70 dark:bg-red-500/10 dark:ring-red-400/20',
    bar: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="size-5 text-amber-500" aria-hidden />,
    accent: 'bg-amber-50 ring-amber-200/70 dark:bg-amber-500/10 dark:ring-amber-400/20',
    bar: 'bg-amber-500',
  },
  info: {
    icon: <Info className="size-5 text-sky-500" aria-hidden />,
    accent: 'bg-sky-50 ring-sky-200/70 dark:bg-sky-500/10 dark:ring-sky-400/20',
    bar: 'bg-sky-500',
  },
};

/** Renders the toast stack. Mount once near the app root. */
export function Toaster() {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-auto sm:items-end sm:px-6 sm:pt-20"
    >
      <AnimatePresence initial={false}>
        {list.map((t) => {
          const s = styles[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              role={t.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 460, damping: 32 }}
              className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-lift backdrop-blur"
            >
              <div className="flex items-start gap-3 p-4 pr-10">
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl ring-1', s.accent)}>{s.icon}</span>
                <div className="min-w-0 flex-1 pt-0.5 text-sm">
                  {t.title && <p className="font-semibold text-ink">{t.title}</p>}
                  <div className={cn('leading-relaxed break-words', t.title ? 'text-muted' : 'font-medium text-ink')}>{t.message}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="absolute top-3 right-3 rounded-lg p-1 text-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
              {t.duration > 0 && (
                <motion.span
                  aria-hidden
                  className={cn('absolute bottom-0 left-0 h-0.5 w-full origin-left', s.bar)}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: t.duration / 1000, ease: 'linear' }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
