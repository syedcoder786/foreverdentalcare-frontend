import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { apiClient, resolveApiBaseUrl } from '../services/apiClient';
import { tokenStore } from '../services/tokenStore';

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response = { config, status, data, statusText: '', headers: {} };
  if (status >= 400) {
    return Promise.reject(new AxiosError('fail', 'ERR_BAD_REQUEST', config, undefined, response as never));
  }
  return Promise.resolve(response);
}

describe('apiClient auth handling', () => {
  const originalAdapter = apiClient.defaults.adapter;
  let seenAuthHeaders: Array<string | undefined>;

  beforeEach(() => {
    seenAuthHeaders = [];
    tokenStore.set('expired-token');
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
    tokenStore.set(null);
  });

  it('attaches the bearer token to admin calls only', async () => {
    tokenStore.set('valid');
    const adapter: AxiosAdapter = (config) => {
      seenAuthHeaders.push(AxiosHeaders.from(config.headers).get('Authorization') as string | undefined);
      return respond(config, 200, { success: true, data: 'ok' });
    };
    apiClient.defaults.adapter = adapter;

    await apiClient.get('/api/public/services');
    await apiClient.get('/api/admin/dashboard');

    expect(seenAuthHeaders[0]).toBeUndefined();
    expect(seenAuthHeaders[1]).toBe('Bearer valid');
  });

  it('refreshes the token once on 401 and retries the request', async () => {
    const adapter: AxiosAdapter = (config) => {
      const auth = AxiosHeaders.from(config.headers).get('Authorization');
      seenAuthHeaders.push(auth as string);
      return auth === 'Bearer fresh-token'
        ? respond(config, 200, { success: true, data: { totalAppointments: 3 } })
        : respond(config, 401, { success: false, message: 'Authentication required' });
    };
    apiClient.defaults.adapter = adapter;
    const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, data: { accessToken: 'fresh-token' } } });

    const res = await apiClient.get('/api/admin/dashboard');

    expect(refresh).toHaveBeenCalledOnce();
    expect(res.data.data.totalAppointments).toBe(3);
    expect(seenAuthHeaders).toEqual(['Bearer expired-token', 'Bearer fresh-token']);
    expect(tokenStore.get()).toBe('fresh-token');
  });

  it('signs out when refresh fails', async () => {
    apiClient.defaults.adapter = (config) => respond(config, 401, { success: false });
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh failed'));
    const onCleared = vi.fn();
    const unsubscribe = tokenStore.onCleared(onCleared);

    await expect(apiClient.get('/api/admin/dashboard')).rejects.toBeInstanceOf(AxiosError);

    expect(onCleared).toHaveBeenCalled();
    expect(tokenStore.get()).toBeNull();
    unsubscribe();
  });

  it('does not try to refresh for public endpoints', async () => {
    apiClient.defaults.adapter = (config) => respond(config, 401, { success: false });
    const refresh = vi.spyOn(axios, 'post');

    await expect(apiClient.get('/api/public/services')).rejects.toBeInstanceOf(AxiosError);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe('resolveApiBaseUrl', () => {
  it('uses same-origin /api by default (Vite proxy on localhost, vercel.json rewrite on Vercel)', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('');
    expect(resolveApiBaseUrl('')).toBe('');
    expect(resolveApiBaseUrl('   ')).toBe('');
  });

  it('honours an explicit VITE_API_BASE_URL without a trailing slash', () => {
    expect(resolveApiBaseUrl('https://api.example.com/')).toBe('https://api.example.com');
  });
});
