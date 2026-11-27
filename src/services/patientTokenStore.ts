/**
 * In-memory patient access token (never written to localStorage). Sessions survive reloads through the HttpOnly
 * patient refresh cookie. A non-secret "has signed in before" flag in localStorage avoids a pointless refresh
 * request for visitors who never signed in.
 */
let accessToken: string | null = null;
const listeners = new Set<() => void>();
const HINT_KEY = 'fdc.patientSession';

export const patientTokenStore = {
  get: () => accessToken,
  set(token: string | null) {
    accessToken = token;
    try {
      if (token) localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    accessToken = null;
    try {
      localStorage.removeItem(HINT_KEY);
    } catch {
      /* storage unavailable */
    }
    listeners.forEach((l) => l());
  },
  /** True if this browser had a patient session, so restoring it is worth a request. */
  hadSession(): boolean {
    try {
      return localStorage.getItem(HINT_KEY) === '1';
    } catch {
      return false;
    }
  },
  onCleared(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
