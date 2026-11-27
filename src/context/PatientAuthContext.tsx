import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PatientAuthPayload, PatientProfile } from '../types';
import { patientApi } from '../services/patientApi';
import { refreshPatientSession } from '../services/apiClient';
import { patientTokenStore } from '../services/patientTokenStore';

type PatientStatus = 'loading' | 'authenticated' | 'anonymous';

interface PatientAuthContextValue {
  status: PatientStatus;
  patient: PatientProfile | null;
  /** Store a session returned by verify/sign-up. */
  setSession: (payload: PatientAuthPayload) => void;
  setPatient: (patient: PatientProfile) => void;
  logout: () => Promise<void>;
  /** Shared sign-in dialog (navbar button, timed prompt). */
  signInOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;
}

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PatientStatus>(() => (patientTokenStore.hadSession() ? 'loading' : 'anonymous'));
  const [patient, setPatientState] = useState<PatientProfile | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const queryClient = useQueryClient();

  // Restore a previous session from the HttpOnly cookie (only if this browser signed in before).
  // If the server can't be reached (e.g. backend restarting), keep the session and retry instead of signing out.
  useEffect(() => {
    if (!patientTokenStore.hadSession()) return;
    let cancelled = false;
    let timer: number | undefined;
    const delays = [2000, 5000, 10000, 20000, 30000];
    const attempt = (n: number) => {
      void refreshPatientSession().then((outcome) => {
        if (cancelled) return;
        if ('payload' in outcome) {
          setPatientState(outcome.payload.patient);
          setStatus('authenticated');
        } else if (outcome.error === 'auth') {
          patientTokenStore.clear();
        } else {
          setStatus((s) => (s === 'loading' ? 'anonymous' : s));
          timer = window.setTimeout(() => attempt(n + 1), delays[Math.min(n, delays.length - 1)]);
        }
      });
    };
    attempt(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(
    () =>
      patientTokenStore.onCleared(() => {
        setPatientState(null);
        setStatus('anonymous');
        queryClient.removeQueries({ queryKey: ['patient'] });
      }),
    [queryClient],
  );

  const setSession = useCallback((payload: PatientAuthPayload) => {
    patientTokenStore.set(payload.accessToken);
    setPatientState(payload.patient);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await patientApi.logout();
    } finally {
      patientTokenStore.clear();
    }
  }, []);

  const openSignIn = useCallback(() => setSignInOpen(true), []);
  const closeSignIn = useCallback(() => setSignInOpen(false), []);

  const value = useMemo(
    () => ({ status, patient, setSession, setPatient: setPatientState, logout, signInOpen, openSignIn, closeSignIn }),
    [status, patient, setSession, logout, signInOpen, openSignIn, closeSignIn],
  );
  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
}

export function usePatientAuth(): PatientAuthContextValue {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error('usePatientAuth must be used inside <PatientAuthProvider>');
  return ctx;
}
