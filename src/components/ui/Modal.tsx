import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

/** Accessible dialog: focus moves in, Escape closes, body scroll locked. Springs in; bottom sheet on mobile. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="modal" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 32 } }}
            exit={{ opacity: 0, y: 32, scale: 0.98, transition: { duration: 0.18 } }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-surface shadow-lift outline-none sm:rounded-3xl',
              'dark:ring-1 dark:ring-white/8',
              widths[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold text-ink">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 rounded-full p-2 text-slate-400 transition hover:rotate-90 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
