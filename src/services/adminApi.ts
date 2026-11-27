import type {
  DatabaseConnectionPayload,
  DatabaseStatus,
  DatabaseSwitchResult,
  DatabaseTestResult,
  AdminAppointmentPayload,
  AdminDaySchedule,
  AdminDoctor,
  ApiResponse,
  Appointment,
  AppointmentFilters,
  AppointmentStatus,
  AuditLog,
  BlockPayload,
  BlockView,
  CalendarRange,
  ClinicSettings,
  ClinicSettingsPayload,
  WhatsAppSettings,
  WhatsAppSettingsPayload,
  MetaTemplate,
  WhatsAppTemplateName,
  WhatsAppTemplate,
  WhatsAppTemplatePayload,
  WhatsAppCampaign,
  Dashboard,
  DaySchedule,
  DentalService,
  DoctorPayload,
  DoctorSchedule,
  GalleryImage,
  NavigationItem,
  PageKey,
  PageResponse,
  Patient,
  PatientDetail,
  Section,
  SectionPayload,
  Seo,
  ServicePayload,
  SpecialHours,
  Specialty,
  SpecialtyPayload,
  Testimonial,
} from '../types';
import { apiClient, unwrap } from './apiClient';

function cleanParams<T extends object>(filters: T) {
  return Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

/** Returns the full envelope so callers can show server messages (e.g. schedule conflict warnings). */
async function withMessage<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<{ data: T; message?: string }> {
  const res = await promise;
  return { data: res.data.data as T, message: res.data.message };
}

async function messageOnly(promise: Promise<{ data: ApiResponse<unknown> }>): Promise<string> {
  const res = await promise;
  return res.data.message ?? 'Done';
}

export const adminApi = {
  getDashboard: () => unwrap(apiClient.get<ApiResponse<Dashboard>>('/api/admin/dashboard')),

  // ---------- appointments ----------
  listAppointments: (filters: AppointmentFilters) =>
    unwrap(apiClient.get<ApiResponse<PageResponse<Appointment>>>('/api/admin/appointments', { params: cleanParams(filters) })),
  getAppointment: (id: number) => unwrap(apiClient.get<ApiResponse<Appointment>>(`/api/admin/appointments/${id}`)),
  createAppointment: (payload: AdminAppointmentPayload) =>
    unwrap(apiClient.post<ApiResponse<Appointment>>('/api/admin/appointments', payload)),
  updateStatus: (id: number, status: AppointmentStatus) =>
    unwrap(apiClient.patch<ApiResponse<Appointment>>(`/api/admin/appointments/${id}/status`, { status })),
  reschedule: (id: number, appointmentDate: string, appointmentTime: string) =>
    unwrap(apiClient.patch<ApiResponse<Appointment>>(`/api/admin/appointments/${id}/reschedule`, { appointmentDate, appointmentTime })),

  // ---------- calendars ----------
  getCalendar: (from: string, to: string, doctorId?: number) =>
    unwrap(apiClient.get<ApiResponse<CalendarRange>>('/api/admin/calendar', { params: cleanParams({ from, to, doctorId }) })),
  getDoctorDay: (doctorId: number, date: string) =>
    unwrap(apiClient.get<ApiResponse<AdminDaySchedule>>(`/api/admin/doctors/${doctorId}/day`, { params: { date } })),

  // ---------- doctors ----------
  listDoctors: () => unwrap(apiClient.get<ApiResponse<AdminDoctor[]>>('/api/admin/doctors')),
  getDoctor: (id: number) => unwrap(apiClient.get<ApiResponse<AdminDoctor>>(`/api/admin/doctors/${id}`)),
  createDoctor: (payload: DoctorPayload) => unwrap(apiClient.post<ApiResponse<AdminDoctor>>('/api/admin/doctors', payload)),
  updateDoctor: (id: number, payload: DoctorPayload) => unwrap(apiClient.put<ApiResponse<AdminDoctor>>(`/api/admin/doctors/${id}`, payload)),
  deleteDoctor: (id: number) => messageOnly(apiClient.delete(`/api/admin/doctors/${id}`)),
  getSchedule: (id: number) => unwrap(apiClient.get<ApiResponse<DoctorSchedule>>(`/api/admin/doctors/${id}/schedule`)),
  saveSchedule: (id: number, weekly: DaySchedule[], specialHours: SpecialHours[]) =>
    withMessage(apiClient.put<ApiResponse<DoctorSchedule>>(`/api/admin/doctors/${id}/schedule`, { weekly, specialHours })),
  addBlock: (doctorId: number, payload: BlockPayload) =>
    withMessage(apiClient.post<ApiResponse<BlockView[]>>(`/api/admin/doctors/${doctorId}/blocked-dates`, payload)),
  deleteBlock: (doctorId: number, blockId: number) => messageOnly(apiClient.delete(`/api/admin/doctors/${doctorId}/blocked-dates/${blockId}`)),

  // ---------- clinic holidays ----------
  listHolidays: () => unwrap(apiClient.get<ApiResponse<BlockView[]>>('/api/admin/holidays')),
  addHoliday: (payload: BlockPayload) => withMessage(apiClient.post<ApiResponse<BlockView[]>>('/api/admin/holidays', payload)),
  deleteHoliday: (id: number) => messageOnly(apiClient.delete(`/api/admin/holidays/${id}`)),

  // ---------- specialties & services ----------
  listSpecialties: () => unwrap(apiClient.get<ApiResponse<Specialty[]>>('/api/admin/specialties')),
  createSpecialty: (payload: SpecialtyPayload) => unwrap(apiClient.post<ApiResponse<Specialty>>('/api/admin/specialties', payload)),
  updateSpecialty: (id: number, payload: SpecialtyPayload) => unwrap(apiClient.put<ApiResponse<Specialty>>(`/api/admin/specialties/${id}`, payload)),
  deleteSpecialty: (id: number) => messageOnly(apiClient.delete(`/api/admin/specialties/${id}`)),

  listServices: () => unwrap(apiClient.get<ApiResponse<DentalService[]>>('/api/admin/services')),
  createService: (payload: ServicePayload) => unwrap(apiClient.post<ApiResponse<DentalService>>('/api/admin/services', payload)),
  updateService: (id: number, payload: ServicePayload) => unwrap(apiClient.put<ApiResponse<DentalService>>(`/api/admin/services/${id}`, payload)),
  deleteService: (id: number) => messageOnly(apiClient.delete(`/api/admin/services/${id}`)),

  // ---------- patients & audit ----------
  listPatients: (params: { search?: string; page?: number; size?: number }) =>
    unwrap(apiClient.get<ApiResponse<PageResponse<Patient>>>('/api/admin/patients', { params: cleanParams(params) })),
  getPatient: (id: number) => unwrap(apiClient.get<ApiResponse<PatientDetail>>(`/api/admin/patients/${id}`)),
  listAuditLogs: (page = 0) => unwrap(apiClient.get<ApiResponse<PageResponse<AuditLog>>>('/api/admin/audit-logs', { params: { page } })),

  // ---------- settings & content ----------
  getSettings: () => unwrap(apiClient.get<ApiResponse<ClinicSettings>>('/api/admin/settings')),
  updateSettings: (payload: ClinicSettingsPayload) => unwrap(apiClient.put<ApiResponse<ClinicSettings>>('/api/admin/settings', payload)),
  getWhatsAppSettings: () => unwrap(apiClient.get<ApiResponse<WhatsAppSettings>>('/api/admin/settings/whatsapp')),
  updateWhatsAppSettings: (payload: WhatsAppSettingsPayload) =>
    unwrap(apiClient.put<ApiResponse<WhatsAppSettings>>('/api/admin/settings/whatsapp', payload)),
  getDatabaseStatus: () => unwrap(apiClient.get<ApiResponse<DatabaseStatus>>('/api/admin/database')),
  testDatabase: (payload: DatabaseConnectionPayload) =>
    unwrap(apiClient.post<ApiResponse<DatabaseTestResult>>('/api/admin/database/test', payload, { timeout: 60_000 })),
  // Migrating and copying a whole database can take a while.
  switchDatabase: (payload: { connection: DatabaseConnectionPayload; copyData: boolean; currentPassword: string }) =>
    unwrap(apiClient.post<ApiResponse<DatabaseSwitchResult>>('/api/admin/database/switch', payload, { timeout: 600_000 })),
  useEnvironmentDatabase: (payload: { copyData: boolean; currentPassword: string }) =>
    unwrap(apiClient.post<ApiResponse<DatabaseSwitchResult>>('/api/admin/database/use-environment', payload, { timeout: 600_000 })),
  sendWhatsAppTest: (phone: string) => apiClient.post<ApiResponse<void>>('/api/admin/settings/whatsapp/test', { phone }),
  getTemplateNames: () => unwrap(apiClient.get<ApiResponse<WhatsAppTemplateName[]>>('/api/admin/whatsapp/template-names')),
  addTemplateName: (name: string, language: string) =>
    unwrap(apiClient.post<ApiResponse<WhatsAppTemplateName>>('/api/admin/whatsapp/template-names', { name, language })),
  deleteTemplateName: (id: number) => apiClient.delete(`/api/admin/whatsapp/template-names/${id}`),
  getTemplateNameDetails: (id: number) =>
    unwrap(apiClient.get<ApiResponse<MetaTemplate>>(`/api/admin/whatsapp/template-names/${id}/details`)),
  getWhatsAppTemplates: () => unwrap(apiClient.get<ApiResponse<WhatsAppTemplate[]>>('/api/admin/whatsapp/templates')),
  createWhatsAppTemplate: (payload: WhatsAppTemplatePayload) =>
    unwrap(apiClient.post<ApiResponse<WhatsAppTemplate>>('/api/admin/whatsapp/templates', payload)),
  updateWhatsAppTemplate: (id: number, payload: WhatsAppTemplatePayload) =>
    unwrap(apiClient.put<ApiResponse<WhatsAppTemplate>>(`/api/admin/whatsapp/templates/${id}`, payload)),
  deleteWhatsAppTemplate: (id: number) => apiClient.delete(`/api/admin/whatsapp/templates/${id}`),
  testWhatsAppTemplate: (id: number, phone: string) =>
    apiClient.post<ApiResponse<void>>(`/api/admin/whatsapp/templates/${id}/test`, { phone }),
  getWhatsAppAudience: () => unwrap(apiClient.get<ApiResponse<{ optedInPatients: number }>>('/api/admin/whatsapp/audience')),
  getWhatsAppCampaigns: () => unwrap(apiClient.get<ApiResponse<WhatsAppCampaign[]>>('/api/admin/whatsapp/campaigns')),
  startWhatsAppCampaign: (templateId: number) =>
    unwrap(apiClient.post<ApiResponse<WhatsAppCampaign>>('/api/admin/whatsapp/campaigns', { templateId })),

  getNavigation: () => unwrap(apiClient.get<ApiResponse<NavigationItem[]>>('/api/admin/navigation')),
  saveNavigation: (items: NavigationItem[]) => unwrap(apiClient.put<ApiResponse<NavigationItem[]>>('/api/admin/navigation', { items })),

  getSections: (pageKey: PageKey) => unwrap(apiClient.get<ApiResponse<Section[]>>(`/api/admin/pages/${pageKey}/sections`)),
  createSection: (pageKey: PageKey, payload: SectionPayload) =>
    unwrap(apiClient.post<ApiResponse<Section>>(`/api/admin/pages/${pageKey}/sections`, payload)),
  updateSection: (id: number, payload: SectionPayload) => unwrap(apiClient.put<ApiResponse<Section>>(`/api/admin/sections/${id}`, payload)),
  deleteSection: (id: number) => messageOnly(apiClient.delete(`/api/admin/sections/${id}`)),

  getSeo: () => unwrap(apiClient.get<ApiResponse<Seo[]>>('/api/admin/seo')),
  saveSeo: (pageKey: PageKey, payload: Omit<Seo, 'pageKey'>) => unwrap(apiClient.put<ApiResponse<Seo>>(`/api/admin/seo/${pageKey}`, payload)),

  listTestimonials: () => unwrap(apiClient.get<ApiResponse<Testimonial[]>>('/api/admin/testimonials')),
  saveTestimonial: (id: number | undefined, payload: Omit<Testimonial, 'id' | 'createdAt'>) =>
    id
      ? unwrap(apiClient.put<ApiResponse<Testimonial>>(`/api/admin/testimonials/${id}`, payload))
      : unwrap(apiClient.post<ApiResponse<Testimonial>>('/api/admin/testimonials', payload)),
  deleteTestimonial: (id: number) => messageOnly(apiClient.delete(`/api/admin/testimonials/${id}`)),

  listGallery: () => unwrap(apiClient.get<ApiResponse<GalleryImage[]>>('/api/admin/gallery')),
  saveGalleryImage: (id: number | undefined, payload: Omit<GalleryImage, 'id' | 'createdAt'>) =>
    id
      ? unwrap(apiClient.put<ApiResponse<GalleryImage>>(`/api/admin/gallery/${id}`, payload))
      : unwrap(apiClient.post<ApiResponse<GalleryImage>>('/api/admin/gallery', payload)),
  deleteGalleryImage: (id: number) => messageOnly(apiClient.delete(`/api/admin/gallery/${id}`)),

  /** multipart/form-data must be set explicitly: the client defaults to JSON and would serialise FormData. */
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap(
      apiClient.post<ApiResponse<{ url: string; fileName: string; contentType: string; size: number }>>('/api/admin/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
};
