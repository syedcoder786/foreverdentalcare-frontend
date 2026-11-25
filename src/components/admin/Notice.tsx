import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Alert } from '../ui/Alert';

/** Success / warning message shown after admin actions. Messages containing "review" are shown as warnings. */
export function Notice({ message, onClear }: { message: string | null; onClear?: () => void }) {
  const [visible, setVisible] = useState(message);
  useEffect(() => {
    setVisible(message);
    if (!message) return;
    const warning = /review|reschedul|please/i.test(message);
    if (warning) return; // warnings stay until dismissed
    const t = setTimeout(() => {
      setVisible(null);
      onClear?.();
    }, 6000);
    return () => clearTimeout(t);
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {visible && (
        <Alert
          tone={/review|reschedul|please/i.test(visible) ? 'warning' : 'success'}
          action={
            <button type="button" className="text-xs font-semibold underline" onClick={() => { setVisible(null); onClear?.(); }}>
              Dismiss
            </button>
          }
        >
          {visible}
        </Alert>
      )}
    </AnimatePresence>
  );
}
