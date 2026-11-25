import type {
  ApiResponse,
  AppointmentRequest,
  BookingConfirmation,
  ClinicSettings,
  DayAvailability,
  DentalService,
  Doctor,
  GalleryImage,
  PageContent,
  PageKey,
  ServiceDetail,
  ServiceRef,
  Site,
  SlotView,
  Specialty,
  SpecialtyDetail,
  Testimonial,
} from '../types';
import { apiClient, unwrap } from './apiClient';

export const publicApi = {
  getSite: () => unwrap(apiClient.get<ApiResponse<Site>>('/api/public/site')),
  getClinic: () => unwrap(apiClient.get<ApiResponse<ClinicSettings>>('/api/public/clinic')),
  getPage: (pageKey: PageKey) => unwrap(apiClient.get<ApiResponse<PageContent>>(`/api/public/pages/${pageKey}`)),

  getSpecialties: () => unwrap(apiClient.get<ApiResponse<Specialty[]>>('/api/public/specialties')),
  getSpecialty: (slug: string) => unwrap(apiClient.get<ApiResponse<SpecialtyDetail>>(`/api/public/specialties/${encodeURIComponent(slug)}`)),

  getServices: (params?: { specialtyId?: number; doctorId?: number }) =>
    unwrap(apiClient.get<ApiResponse<DentalService[]>>('/api/public/services', { params })),
  getService: (slug: string) => unwrap(apiClient.get<ApiResponse<ServiceDetail>>(`/api/public/services/${encodeURIComponent(slug)}`)),

  getDoctors: (specialtyId?: number) =>
    unwrap(apiClient.get<ApiResponse<Doctor[]>>('/api/public/doctors', { params: specialtyId ? { specialtyId } : undefined })),
  getDoctorBySlug: (slug: string) =>
    unwrap(apiClient.get<ApiResponse<Doctor>>(`/api/public/doctors/by-slug/${encodeURIComponent(slug)}`)),
  getDoctorServices: (doctorId: number, specialtyId?: number) =>
    unwrap(apiClient.get<ApiResponse<ServiceRef[]>>(`/api/public/doctors/${doctorId}/services`, { params: specialtyId ? { specialtyId } : undefined })),
  getDoctorAvailability: (doctorId: number, date: string, serviceId?: number) =>
    unwrap(apiClient.get<ApiResponse<DayAvailability>>(`/api/public/doctors/${doctorId}/availability`, { params: { date, serviceId } })),
  getAvailableSlots: (doctorId: number, date: string, serviceId?: number) =>
    unwrap(apiClient.get<ApiResponse<SlotView[]>>(`/api/public/doctors/${doctorId}/available-slots`, { params: { date, serviceId } })),

  getTestimonials: () => unwrap(apiClient.get<ApiResponse<Testimonial[]>>('/api/public/testimonials')),
  getGallery: () => unwrap(apiClient.get<ApiResponse<GalleryImage[]>>('/api/public/gallery')),

  requestAppointment: (payload: AppointmentRequest) =>
    unwrap(apiClient.post<ApiResponse<BookingConfirmation>>('/api/public/appointments', payload)),
};
