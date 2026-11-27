import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock3, Sparkles } from 'lucide-react';
import { usePatientAuth } from '../../context/PatientAuthContext';
import { Modal } from '../ui/Modal';
import { PatientAuthFlow } from './PatientAuthFlow';

/** Seconds after the site opens before the sign-in prompt appears (for anonymous visitors). */
const PROMPT_DELAY_SECONDS = 20;
/** After the prompt is dismissed, don't show it again for this long. */
const DISMISS_DAYS = 3;
const DISMISSED_KEY = 'fdc.signInPromptDismissedAt';
const NO_PROMPT_PATHS = ['/book', '/profile', '/admin'];

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/** Shared patient sign-in dialog, plus the timed prompt shown a little while after the website opens. */
export function PatientSignInModal() {
  const { status, signInOpen, openSignIn, closeSignIn } = usePatientAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const autoOpened = useRef(false);
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (status !== 'anonymous' || autoOpened.current || recentlyDismissed()) return;
    const timer = window.setTimeout(() => {
      if (NO_PROMPT_PATHS.some((p) => pathRef.current.startsWith(p))) return;
      autoOpened.current = true;
      openSignIn();
    }, PROMPT_DELAY_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [status, openSignIn]);

  // Close the dialog if the patient signs in somewhere else (e.g. on the booking page).
  useEffect(() => {
    if (status === 'authenticated' && signInOpen) closeSignIn();
  }, [status, signInOpen, closeSignIn]);

  const dismiss = () => {
    rememberDismissed();
    closeSignIn();
  };

  return (
    <Modal open={signInOpen && status !== 'authenticated'} onClose={dismiss} title="Your Forever Dental Care profile" size="sm">
      <div className="space-y-6">
        <ul className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-muted">
          {[
            { icon: CalendarCheck, text: 'Book in seconds' },
            { icon: Clock3, text: 'Track your visits' },
            { icon: Sparkles, text: 'No password' },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="rounded-2xl bg-brand-50/70 px-2 py-3 ring-1 ring-brand-100 dark:ring-brand-400/15">
              <Icon className="mx-auto mb-1.5 size-5 text-brand-600 dark:text-brand-300" aria-hidden />
              {text}
            </li>
          ))}
        </ul>
        <PatientAuthFlow
          onSignedIn={() => {
            closeSignIn();
            if (!NO_PROMPT_PATHS.some((p) => location.pathname.startsWith(p))) navigate('/profile');
          }}
        />
      </div>
    </Modal>
  );
}
