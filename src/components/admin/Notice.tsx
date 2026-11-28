import { useEffect } from 'react';
import { toast } from '../ui/Toast';

const isWarning = (m: string) => /review|reschedul|please/i.test(m);

/**
 * Success / warning message shown after admin actions, as a toast (so it is visible wherever the user has scrolled).
 * Messages containing "review" / "reschedule" / "please" are shown as warnings and stay longer.
 */
export function Notice({ message, onClear }: { message: string | null; onClear?: () => void }) {
  useEffect(() => {
    if (!message) return;
    if (isWarning(message)) toast.warning(message, { duration: 12000 });
    else toast.success(message);
    onClear?.();
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
