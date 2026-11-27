import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Pencil, ShieldCheck, UserRound } from 'lucide-react';
import type { OtpSent, PatientAuthPayload } from '../../types';
import { patientApi } from '../../services/patientApi';
import { usePatientAuth } from '../../context/PatientAuthContext';
import { parseApiError } from '../../utils/errors';
import { Input } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { WhatsAppIcon } from '../layout/WhatsAppButton';
import { cn } from '../../utils/cn';

type Step = 'phone' | 'code' | 'name';
const CODE_LENGTH = 6;

interface PatientAuthFlowProps {
  /** Called once the patient is signed in (returning patient, or new patient after adding their name). */
  onSignedIn?: (payload: PatientAuthPayload) => void;
  /** Heading shown on the first step. */
  title?: string;
  subtitle?: string;
}

/**
 * Silent sign-up / sign-in: mobile number -> 6-digit WhatsApp code -> (first time only) name.
 * The mobile number is the account; there is no password.
 */
export function PatientAuthFlow({ onSignedIn, title = 'Sign in with your mobile', subtitle }: PatientAuthFlowProps) {
  const { setSession } = usePatientAuth();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState<OtpSent | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [signupToken, setSignupToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(0);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'code') inputs.current[0]?.focus();
  }, [step]);

  const fail = (err: unknown) => {
    const parsed = parseApiError(err);
    setFieldErrors(parsed.fieldErrors);
    setError(Object.keys(parsed.fieldErrors).length ? null : parsed.message);
  };

  const finish = (payload: PatientAuthPayload) => {
    setSession(payload);
    onSignedIn?.(payload);
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setFieldErrors({});
    if (phone.replace(/\D/g, '').length < 10) {
      setFieldErrors({ phone: 'Please enter your 10-digit mobile number' });
      return;
    }
    setBusy(true);
    try {
      const result = await patientApi.requestOtp(phone);
      setSent(result);
      setDigits(Array(CODE_LENGTH).fill(''));
      setResendIn(result.resendAfterSeconds);
      setStep('code');
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (code: string) => {
    if (code.length !== CODE_LENGTH || busy) return;
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      const result = await patientApi.verifyOtp(sent?.phone ?? phone, code);
      if (result.auth) {
        finish(result.auth);
      } else if (result.signupToken) {
        setSignupToken(result.signupToken);
        setStep('name');
      }
    } catch (err) {
      fail(err);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      fillFrom(index, clean);
      return;
    }
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (next.every(Boolean)) void verify(next.join(''));
  };

  const fillFrom = (index: number, text: string) => {
    const next = [...digits];
    text.slice(0, CODE_LENGTH - index).split('').forEach((d, i) => (next[index + i] = d));
    setDigits(next);
    inputs.current[Math.min(index + text.length, CODE_LENGTH - 1)]?.focus();
    if (next.every(Boolean)) void verify(next.join(''));
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '');
    if (text) {
      e.preventDefault();
      fillFrom(0, text);
    }
  };

  const completeSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (fullName.trim().length < 2) {
      setFieldErrors({ fullName: 'Please enter your name' });
      return;
    }
    setBusy(true);
    try {
      finish(await patientApi.signup(signupToken, fullName.trim(), email.trim() || undefined));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const slide = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.25 } };

  return (
    <div className="space-y-5">
      <AnimatePresence>{error && <Alert tone="error">{error}</Alert>}</AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {step === 'phone' && (
          <motion.form key="phone" {...slide} onSubmit={sendCode} noValidate className="space-y-5">
            <Header
              icon={<WhatsAppIcon className="size-6 text-[#25D366]" />}
              title={title}
              text={subtitle ?? "We'll send a 6-digit code to your WhatsApp. No password needed."}
            />
            <Input
              label="Mobile number"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone}
              autoFocus
            />
            <Button type="submit" size="lg" fullWidth loading={busy} icon={<ArrowRight className="size-4" aria-hidden />}>
              {busy ? 'Sending code...' : 'Send code on WhatsApp'}
            </Button>
          </motion.form>
        )}

        {step === 'code' && (
          <motion.div key="code" {...slide} className="space-y-5">
            <Header
              icon={<ShieldCheck className="size-6 text-brand-600" />}
              title="Enter the code"
              text={
                <>
                  Sent on WhatsApp to <span className="font-semibold text-ink">{sent?.maskedPhone ?? phone}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError(null);
                      setFieldErrors({});
                    }}
                    className="ml-2 inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline dark:text-brand-300"
                  >
                    <Pencil className="size-3" aria-hidden /> Change
                  </button>
                </>
              }
            />
            <div>
              <div className="flex justify-between gap-2" role="group" aria-label="6-digit code">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onPaste={onPaste}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={CODE_LENGTH}
                    aria-label={`Digit ${i + 1}`}
                    disabled={busy}
                    className={cn(
                      'h-14 w-full min-w-0 rounded-xl border bg-surface text-center text-2xl font-semibold text-ink transition-all outline-none',
                      'focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-400/20',
                      fieldErrors.code ? 'border-red-400' : d ? 'border-brand-300' : 'border-slate-300',
                    )}
                  />
                ))}
              </div>
              {fieldErrors.code && <p className="mt-2 text-sm text-red-600" role="alert">{fieldErrors.code}</p>}
            </div>
            <Button size="lg" fullWidth loading={busy} onClick={() => verify(digits.join(''))} disabled={!digits.every(Boolean)}>
              {busy ? 'Checking...' : 'Verify'}
            </Button>
            <p className="text-center text-sm text-muted">
              Didn&apos;t get it?{' '}
              {resendIn > 0 ? (
                <span>Resend in {resendIn}s</span>
              ) : (
                <button type="button" onClick={() => sendCode()} className="font-semibold text-brand-700 hover:underline dark:text-brand-300" disabled={busy}>
                  Resend code
                </button>
              )}
            </p>
          </motion.div>
        )}

        {step === 'name' && (
          <motion.form key="name" {...slide} onSubmit={completeSignup} noValidate className="space-y-5">
            <Header
              icon={<UserRound className="size-6 text-brand-600" />}
              title="Welcome! What's your name?"
              text="Your number is verified. Add your name to create your profile."
            />
            <Input
              label="Full name"
              required
              autoComplete="name"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={fieldErrors.fullName}
              autoFocus
            />
            <Input
              label="Email"
              optional
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
            />
            <Button type="submit" size="lg" fullWidth loading={busy} icon={<ArrowRight className="size-4" aria-hidden />}>
              {busy ? 'Creating profile...' : 'Create my profile'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="mx-auto flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="size-3.5" aria-hidden /> Use a different number
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({ icon, title, text }: { icon: React.ReactNode; title: string; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100 dark:ring-brand-400/20">
        {icon}
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-0.5 text-sm text-muted">{text}</p>
      </div>
    </div>
  );
}
