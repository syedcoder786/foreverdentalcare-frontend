import type { ApiResponse, AuthPayload } from '../types';
import { apiClient, unwrap } from './apiClient';

export const authApi = {
  login: (email: string, password: string) =>
    unwrap(apiClient.post<ApiResponse<AuthPayload>>('/api/auth/login', { email, password })),

  refresh: () => unwrap(apiClient.post<ApiResponse<AuthPayload>>('/api/auth/refresh')),

  logout: () => apiClient.post('/api/auth/logout'),
};
