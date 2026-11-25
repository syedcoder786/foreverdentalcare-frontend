import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthPayload } from '../types';
import { tokenStore } from './tokenStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Shared axios instance. `withCredentials` lets the refresh-token cookie flow to /api/auth/*. */
export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token && config.url?.startsWith('/api/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh request. */
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

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const isAdminCall = original?.url?.startsWith('/api/admin');
    if (error.response?.status === 401 && original && isAdminCall && !original._retried) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original as AxiosRequestConfig);
      }
      tokenStore.clear();
    }
    return Promise.reject(error);
  },
);

/** Unwraps the `data` field of the API envelope. */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data as T;
}
