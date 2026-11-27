import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/adminApi';
import type {
  AdminAppointmentPayload,
  DatabaseConnectionPayload,
  WhatsAppSettingsPayload,
  WhatsAppTemplatePayload,
  AppointmentFilters,
  AppointmentStatus,
  BlockPayload,
  ClinicSettingsPayload,
  DaySchedule,
  DoctorPayload,
  GalleryImage,
  NavigationItem,
  PageKey,
  SectionPayload,
  Seo,
  ServicePayload,
  SpecialHours,
  SpecialtyPayload,
  Testimonial,
} from '../types';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  appointments: (filters: AppointmentFilters) => ['admin', 'appointments', filters] as const,
  appointment: (id: number) => ['admin', 'appointment', id] as const,
  calendar: (from: string, to: string, doctorId?: number) => ['admin', 'calendar', from, to, doctorId ?? 'all'] as const,
  doctorDay: (doctorId: number, date: string) => ['admin', 'doctor-day', doctorId, date] as const,
  doctors: ['admin', 'doctors'] as const,
  doctor: (id: number) => ['admin', 'doctor', id] as const,
  schedule: (id: number) => ['admin', 'schedule', id] as const,
  holidays: ['admin', 'holidays'] as const,
  specialties: ['admin', 'specialties'] as const,
  services: ['admin', 'services'] as const,
  patients: (params: object) => ['admin', 'patients', params] as const,
  patient: (id: number) => ['admin', 'patient', id] as const,
  audit: (page: number) => ['admin', 'audit', page] as const,
  settings: ['admin', 'settings'] as const,
  whatsapp: ['admin', 'settings', 'whatsapp'] as const,
  database: ['admin', 'database'] as const,
  whatsappTemplates: ['admin', 'whatsapp', 'templates'] as const,
  templateNames: ['admin', 'whatsapp', 'template-names'] as const,
  templateDetails: (id: number) => ['admin', 'whatsapp', 'template-details', id] as const,
  whatsappAudience: ['admin', 'whatsapp', 'audience'] as const,
  whatsappCampaigns: ['admin', 'whatsapp', 'campaigns'] as const,
  navigation: ['admin', 'navigation'] as const,
  sections: (pageKey: PageKey) => ['admin', 'sections', pageKey] as const,
  seo: ['admin', 'seo'] as const,
  testimonials: ['admin', 'testimonials'] as const,
  gallery: ['admin', 'gallery'] as const,
};

/** After any write, refresh admin data and the public website caches. */
function useInvalidate() {
  const queryClient = useQueryClient();
  return (...prefixes: string[]) => {
    queryClient.invalidateQueries({ queryKey: ['public'] });
    if (prefixes.length === 0) {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      return;
    }
    prefixes.forEach((p) => queryClient.invalidateQueries({ queryKey: ['admin', p] }));
    queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
  };
}

// ---------- dashboard & appointments ----------
export function useDashboard() {
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: adminApi.getDashboard, refetchInterval: 60_000 });
}

export function useAppointments(filters: AppointmentFilters) {
  return useQuery({ queryKey: adminKeys.appointments(filters), queryFn: () => adminApi.listAppointments(filters), placeholderData: keepPreviousData });
}

export function useAppointment(id: number | null) {
  return useQuery({ queryKey: adminKeys.appointment(id ?? 0), queryFn: () => adminApi.getAppointment(id as number), enabled: id !== null });
}

const APPOINTMENT_PREFIXES = ['appointments', 'appointment', 'calendar', 'doctor-day', 'patients', 'patient'];

export function useUpdateAppointmentStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) => adminApi.updateStatus(id, status),
    onSuccess: () => invalidate(...APPOINTMENT_PREFIXES),
  });
}

export function useRescheduleAppointment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, date, time }: { id: number; date: string; time: string }) => adminApi.reschedule(id, date, time),
    onSuccess: () => invalidate(...APPOINTMENT_PREFIXES),
  });
}

export function useCreateAppointment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: AdminAppointmentPayload) => adminApi.createAppointment(payload),
    onSuccess: () => invalidate(...APPOINTMENT_PREFIXES),
  });
}

// ---------- calendars ----------
export function useCalendar(from: string, to: string, doctorId?: number) {
  return useQuery({ queryKey: adminKeys.calendar(from, to, doctorId), queryFn: () => adminApi.getCalendar(from, to, doctorId), placeholderData: keepPreviousData });
}

export function useDoctorDay(doctorId: number | undefined, date: string) {
  return useQuery({
    queryKey: adminKeys.doctorDay(doctorId ?? 0, date),
    queryFn: () => adminApi.getDoctorDay(doctorId as number, date),
    enabled: Boolean(doctorId),
  });
}

// ---------- doctors ----------
export function useAdminDoctors() {
  return useQuery({ queryKey: adminKeys.doctors, queryFn: adminApi.listDoctors });
}

export function useAdminDoctor(id: number | undefined) {
  return useQuery({ queryKey: adminKeys.doctor(id ?? 0), queryFn: () => adminApi.getDoctor(id as number), enabled: Boolean(id) });
}

export function useSaveDoctor() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: DoctorPayload }) => (id ? adminApi.updateDoctor(id, payload) : adminApi.createDoctor(payload)),
    onSuccess: () => invalidate('doctors', 'doctor', 'services', 'specialties'),
  });
}

export function useDeleteDoctor() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminApi.deleteDoctor(id), onSuccess: () => invalidate('doctors', 'doctor') });
}

export function useDoctorSchedule(id: number | undefined) {
  return useQuery({ queryKey: adminKeys.schedule(id ?? 0), queryFn: () => adminApi.getSchedule(id as number), enabled: Boolean(id) });
}

export function useSaveSchedule() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, weekly, specialHours }: { id: number; weekly: DaySchedule[]; specialHours: SpecialHours[] }) =>
      adminApi.saveSchedule(id, weekly, specialHours),
    onSuccess: () => invalidate('schedule', 'doctors', 'doctor', 'calendar', 'doctor-day'),
  });
}

export function useAddBlock() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ doctorId, payload }: { doctorId?: number; payload: BlockPayload }) =>
      doctorId ? adminApi.addBlock(doctorId, payload) : adminApi.addHoliday(payload),
    onSuccess: () => invalidate('schedule', 'holidays', 'calendar', 'doctor-day'),
  });
}

export function useDeleteBlock() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ doctorId, blockId }: { doctorId?: number; blockId: number }) =>
      doctorId ? adminApi.deleteBlock(doctorId, blockId) : adminApi.deleteHoliday(blockId),
    onSuccess: () => invalidate('schedule', 'holidays', 'calendar', 'doctor-day'),
  });
}

export function useHolidays() {
  return useQuery({ queryKey: adminKeys.holidays, queryFn: adminApi.listHolidays });
}

// ---------- specialties & services ----------
export function useAdminSpecialties() {
  return useQuery({ queryKey: adminKeys.specialties, queryFn: adminApi.listSpecialties });
}

export function useSaveSpecialty() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: SpecialtyPayload }) => (id ? adminApi.updateSpecialty(id, payload) : adminApi.createSpecialty(payload)),
    onSuccess: () => invalidate('specialties'),
  });
}

export function useDeleteSpecialty() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminApi.deleteSpecialty(id), onSuccess: () => invalidate('specialties') });
}

export function useAdminServices() {
  return useQuery({ queryKey: adminKeys.services, queryFn: adminApi.listServices });
}

export function useSaveService() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: ServicePayload }) => (id ? adminApi.updateService(id, payload) : adminApi.createService(payload)),
    onSuccess: () => invalidate('services', 'doctors', 'doctor', 'specialties'),
  });
}

export function useDeleteService() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminApi.deleteService(id), onSuccess: () => invalidate('services', 'doctors', 'doctor') });
}

// ---------- patients & audit ----------
export function usePatients(params: { search?: string; page?: number; size?: number }) {
  return useQuery({ queryKey: adminKeys.patients(params), queryFn: () => adminApi.listPatients(params), placeholderData: keepPreviousData });
}

export function usePatient(id: number | null) {
  return useQuery({ queryKey: adminKeys.patient(id ?? 0), queryFn: () => adminApi.getPatient(id as number), enabled: id !== null });
}

export function useAuditLogs(page: number) {
  return useQuery({ queryKey: adminKeys.audit(page), queryFn: () => adminApi.listAuditLogs(page) });
}

// ---------- settings & content ----------
export function useAdminSettings() {
  return useQuery({ queryKey: adminKeys.settings, queryFn: adminApi.getSettings });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: ClinicSettingsPayload) => adminApi.updateSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.settings, data);
      invalidate('settings');
    },
  });
}

export function useAdminNavigation() {
  return useQuery({ queryKey: adminKeys.navigation, queryFn: adminApi.getNavigation });
}

export function useSaveNavigation() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (items: NavigationItem[]) => adminApi.saveNavigation(items), onSuccess: () => invalidate('navigation') });
}

export function useAdminSections(pageKey: PageKey) {
  return useQuery({ queryKey: adminKeys.sections(pageKey), queryFn: () => adminApi.getSections(pageKey) });
}

export function useSaveSection(pageKey: PageKey) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: SectionPayload }) =>
      id ? adminApi.updateSection(id, payload) : adminApi.createSection(pageKey, payload),
    onSuccess: () => invalidate('sections'),
  });
}

export function useDeleteSection() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminApi.deleteSection(id), onSuccess: () => invalidate('sections') });
}

export function useAdminSeo() {
  return useQuery({ queryKey: adminKeys.seo, queryFn: adminApi.getSeo });
}

export function useSaveSeo() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ pageKey, payload }: { pageKey: PageKey; payload: Omit<Seo, 'pageKey'> }) => adminApi.saveSeo(pageKey, payload),
    onSuccess: () => invalidate('seo'),
  });
}

export function useAdminTestimonials() {
  return useQuery({ queryKey: adminKeys.testimonials, queryFn: adminApi.listTestimonials });
}

export function useSaveTestimonial() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: Omit<Testimonial, 'id' | 'createdAt'> }) => adminApi.saveTestimonial(id, payload),
    onSuccess: () => invalidate('testimonials'),
  });
}

export function useDeleteTestimonial() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminApi.deleteTestimonial(id), onSuccess: () => invalidate('testimonials') });
}

export function useAdminGallery() {
  return useQuery({ queryKey: adminKeys.gallery, queryFn: adminApi.listGallery });
}

export function useSaveGalleryImage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: Omit<GalleryImage, 'id' | 'createdAt'> }) => adminApi.saveGalleryImage(id, payload),
    onSuccess: () => invalidate('gallery'),
  });
}

export function useDeleteGalleryImage() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => adminApi.deleteGalleryImage(id), onSuccess: () => invalidate('gallery') });
}

export function useUploadImage() {
  return useMutation({ mutationFn: (file: File) => adminApi.uploadImage(file) });
}

export function useWhatsAppSettings() {
  return useQuery({ queryKey: adminKeys.whatsapp, queryFn: adminApi.getWhatsAppSettings });
}

export function useSaveWhatsAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WhatsAppSettingsPayload) => adminApi.updateWhatsAppSettings(payload),
    onSuccess: (data) => queryClient.setQueryData(adminKeys.whatsapp, data),
  });
}

export function useSendWhatsAppTest() {
  return useMutation({ mutationFn: (phone: string) => adminApi.sendWhatsAppTest(phone) });
}

export function useWhatsAppTemplates() {
  return useQuery({ queryKey: adminKeys.whatsappTemplates, queryFn: adminApi.getWhatsAppTemplates });
}

/** Template names the admin saved for reuse. */
export function useTemplateNames() {
  return useQuery({ queryKey: adminKeys.templateNames, queryFn: adminApi.getTemplateNames });
}

export function useAddTemplateName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, language }: { name: string; language: string }) => adminApi.addTemplateName(name, language),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.templateNames }),
  });
}

export function useDeleteTemplateName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteTemplateName(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.templateNames }),
  });
}

/** The saved template's text and placeholders, read from Meta. */
export function useTemplateNameDetails(id?: number) {
  return useQuery({
    queryKey: adminKeys.templateDetails(id ?? 0),
    queryFn: () => adminApi.getTemplateNameDetails(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: false,
  });
}

export function useSaveWhatsAppTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: WhatsAppTemplatePayload }) =>
      id ? adminApi.updateWhatsAppTemplate(id, payload) : adminApi.createWhatsAppTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.whatsappTemplates });
      queryClient.invalidateQueries({ queryKey: adminKeys.templateNames });
    },
  });
}

export function useDeleteWhatsAppTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteWhatsAppTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.whatsappTemplates });
      queryClient.invalidateQueries({ queryKey: adminKeys.templateNames });
    },
  });
}

export function useTestWhatsAppTemplate() {
  return useMutation({ mutationFn: ({ id, phone }: { id: number; phone: string }) => adminApi.testWhatsAppTemplate(id, phone) });
}

export function useWhatsAppAudience() {
  return useQuery({ queryKey: adminKeys.whatsappAudience, queryFn: adminApi.getWhatsAppAudience });
}

/** Polls every 3 seconds while a campaign is still sending. */
export function useWhatsAppCampaigns() {
  return useQuery({
    queryKey: adminKeys.whatsappCampaigns,
    queryFn: adminApi.getWhatsAppCampaigns,
    refetchInterval: (query) => (query.state.data?.some((c) => c.status === 'SENDING') ? 3000 : false),
  });
}

export function useStartWhatsAppCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: number) => adminApi.startWhatsAppCampaign(templateId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.whatsappCampaigns }),
  });
}

/* ---------- Database connection ---------- */

export function useDatabaseStatus() {
  return useQuery({ queryKey: adminKeys.database, queryFn: adminApi.getDatabaseStatus });
}

export function useTestDatabase() {
  return useMutation({ mutationFn: (payload: DatabaseConnectionPayload) => adminApi.testDatabase(payload) });
}

/** After a switch every cached query belongs to the old database, so all of them are refetched. */
export function useSwitchDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.switchDatabase,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUseEnvironmentDatabase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.useEnvironmentDatabase,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
