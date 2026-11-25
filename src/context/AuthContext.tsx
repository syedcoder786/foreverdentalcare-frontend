import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminProfile } from '../types';
import { authApi } from '../services/authApi';
import { tokenStore } from '../services/tokenStore';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  admin: AdminProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const queryClient = useQueryClient();

  // Restore the session on load using the HttpOnly refresh cookie.
  useEffect(() => {
    let cancelled = false;
    authApi
      .refresh()
      .then((payload) => {
        if (cancelled) return;
        tokenStore.set(payload.accessToken);
        setAdmin(payload.admin);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to forced sign-out (refresh failed inside the API client).
  useEffect(
    () =>
      tokenStore.onCleared(() => {
        setAdmin(null);
        setStatus('anonymous');
        queryClient.removeQueries({ queryKey: ['admin'] });
      }),
    [queryClient],
  );

  const login = useCallback(async (email: string, password: string) => {
    const payload = await authApi.login(email, password);
    tokenStore.set(payload.accessToken);
    setAdmin(payload.admin);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
    }
  }, []);

  const value = useMemo(() => ({ status, admin, login, logout }), [status, admin, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
