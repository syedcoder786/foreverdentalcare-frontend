/**
 * In-memory access-token storage. The access token is never written to localStorage/sessionStorage, which keeps it
 * out of reach of persistent XSS theft. Sessions survive reloads via the HttpOnly refresh-token cookie instead.
 */
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export const tokenStore = {
  get: () => accessToken,
  set(token: string | null) {
    accessToken = token;
  },
  clear() {
    accessToken = null;
    listeners.forEach((l) => l());
  },
  /** Subscribe to forced sign-outs (e.g. refresh failed). Returns an unsubscribe function. */
  onCleared(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
