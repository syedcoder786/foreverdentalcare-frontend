import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthPayload, PatientAuthPayload } from '../types';
import { tokenStore } from './tokenStore';
import { patientTokenStore } from './patientTokenStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Shared axios instance. `withCredentials` lets the refresh-token cookies flow to /api/auth/* and /api/patient-auth/*. */
export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const isAdminUrl = (url?: string) => Boolean(url?.startsWith('/api/admin'));
/** Note the trailing slash: /api/patient-auth/* (sign-in) must not get the patient token. */
const isPatientUrl = (url?: string) => Boolean(url?.startsWith('/api/patient/'));

apiClient.interceptors.request.use((config) => {
  const token = isAdminUrl(config.url) ? tokenStore.get() : isPatientUrl(config.url) ? patientTokenStore.get() : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;
let patientRefreshPromise: Promise<PatientRefreshOutcome> | null = null;

/**
 * Result of a patient session refresh. `auth` means the server rejected the session (really signed out);
 * `network` means the server couldn't be reached or failed (e.g. backend restarting) and the session may still be fine.
 */
export type PatientRefreshOutcome = { payload: PatientAuthPayload } | { error: 'auth' | 'network' };

/** Single-flight admin refresh: concurrent 401s share one refresh request. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<AuthPayload>>(`${baseURL}/api/auth/refresh`, null, { withCredentials: true })
      .then((res) => {
        const token = res.data.data?.accessToken ?? null;
        tokenStore.set(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Single-flight patient refresh: every caller at the same moment (page load, several 401s, React StrictMode's
 * double effect) shares one request, so the rotating refresh cookie is only used once.
 */
export function refreshPatientSession(): Promise<PatientRefreshOutcome> {
  if (!patientRefreshPromise) {
    patientRefreshPromise = axios
      .post<ApiResponse<PatientAuthPayload>>(`${baseURL}/api/patient-auth/refresh`, null, { withCredentials: true })
      .then((res): PatientRefreshOutcome => {
        const payload = res.data.data;
        if (!payload?.accessToken) return { error: 'auth' };
        patientTokenStore.set(payload.accessToken);
        return { payload };
      })
      .catch((err: AxiosError): PatientRefreshOutcome => {
        const status = err.response?.status;
        return { error: status === 401 || status === 403 ? 'auth' : 'network' };
      })
      .finally(() => {
        patientRefreshPromise = null;
      });
  }
  return patientRefreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      if (isAdminUrl(original.url)) {
        original._retried = true;
        const token = await refreshAccessToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original as AxiosRequestConfig);
        }
        tokenStore.clear();
      } else if (isPatientUrl(original.url)) {
        original._retried = true;
        const outcome = await refreshPatientSession();
        if ('payload' in outcome) {
          original.headers.Authorization = `Bearer ${outcome.payload.accessToken}`;
          return apiClient(original as AxiosRequestConfig);
        }
        // Only a rejected session signs the patient out; a network/server hiccup keeps it.
        if (outcome.error === 'auth') patientTokenStore.clear();
      }
    }
    return Promise.reject(error);
  },
);

/** Unwraps the `data` field of the API envelope. */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data as T;
}
