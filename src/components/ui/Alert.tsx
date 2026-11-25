import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

type Tone = 'error' | 'success' | 'info' | 'warning';

const tones: Record<Tone, { box: string; icon: ReactNode }> = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', icon: <XCircle className="size-5 text-red-500" aria-hidden /> },
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />,
  },
  info: { box: 'border-sky-soft-200 bg-sky-soft-50 text-sky-soft-700', icon: <Info className="size-5" aria-hidden /> },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: <AlertTriangle className="size-5 text-amber-500" aria-hidden />,
  },
};

interface AlertProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const t = tones[tone];
  return (
    <motion.div
      role={tone === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className={cn('flex gap-3 rounded-2xl border p-4 text-sm', t.box, className)}
    >
      <div className="shrink-0">{t.icon}</div>
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </motion.div>
  );
}

/** Standard error block for failed queries, with an optional retry. */
export function ErrorMessage({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <Alert
      tone="error"
      title="Something went wrong"
      className={className}
      action={
        onRetry && (
          <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2 hover:no-underline">
            Try again
          </button>
        )
      }
    >
      {message}
    </Alert>
  );
}
