import type {
  ApiResponse,
  BookingConfirmation,
  OtpSent,
  OtpVerifyResult,
  PatientAppointment,
  PatientAuthPayload,
  PatientBookingRequest,
  PatientProfile,
} from '../types';
import { apiClient, unwrap } from './apiClient';

export const patientApi = {
  // Sign-in
  requestOtp: (phone: string) => unwrap(apiClient.post<ApiResponse<OtpSent>>('/api/patient-auth/otp/request', { phone })),
  verifyOtp: (phone: string, code: string) =>
    unwrap(apiClient.post<ApiResponse<OtpVerifyResult>>('/api/patient-auth/otp/verify', { phone, code })),
  signup: (signupToken: string, fullName: string, email?: string, whatsappOptIn?: boolean) =>
    unwrap(apiClient.post<ApiResponse<PatientAuthPayload>>('/api/patient-auth/signup', { signupToken, fullName, email, whatsappOptIn })),
  refresh: () => unwrap(apiClient.post<ApiResponse<PatientAuthPayload>>('/api/patient-auth/refresh')),
  logout: () => apiClient.post('/api/patient-auth/logout'),

  // Signed-in patient
  me: () => unwrap(apiClient.get<ApiResponse<PatientProfile>>('/api/patient/me')),
  updateMe: (fullName: string, email?: string, whatsappOptIn?: boolean) =>
    unwrap(apiClient.put<ApiResponse<PatientProfile>>('/api/patient/me', { fullName, email, whatsappOptIn })),
  appointments: () => unwrap(apiClient.get<ApiResponse<PatientAppointment[]>>('/api/patient/appointments')),
  book: (payload: PatientBookingRequest) =>
    unwrap(apiClient.post<ApiResponse<BookingConfirmation>>('/api/patient/appointments', payload)),
};
