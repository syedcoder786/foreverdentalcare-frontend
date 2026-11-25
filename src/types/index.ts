/** Mirrors the backend's consistent response envelope. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type Gender = 'FEMALE' | 'MALE' | 'UNSPECIFIED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type PageKey = 'HOME' | 'ABOUT' | 'DOCTORS' | 'SPECIALTIES' | 'SERVICES' | 'CONTACT' | 'BOOK';

// ---------------------------------------------------------------- catalogue

export interface SpecialtyRef {
  id: number;
  name: string;
  slug: string;
}

export interface Specialty extends SpecialtyRef {
  description?: string;
  icon?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
  doctorCount: number;
  serviceCount: number;
}

export interface DoctorSummary {
  id: number;
  fullName: string;
  slug: string;
  professionalTitle?: string;
}

export interface DentalService {
  id: number;
  name: string;
  slug: string;
  description: string;
  details: string[];
  icon?: string;
  imageUrl?: string;
  consultationFee?: number | null;
  estimatedDuration: number;
  displayOrder: number;
  active: boolean;
  specialty: SpecialtyRef;
  doctors: DoctorSummary[];
}

export interface ServiceRef {
  id: number;
  name: string;
  slug: string;
  specialtyId: number;
  specialtyName: string;
  estimatedDuration: number;
  consultationFee?: number | null;
  active: boolean;
}

export interface Qualification {
  degree: string;
  institution?: string;
  year?: string;
}

export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  active: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  slotDurationMinutes: number;
}

export interface Doctor {
  id: number;
  fullName: string;
  slug: string;
  professionalTitle: string;
  gender: Gender;
  profileImageUrl?: string;
  shortBio?: string;
  biography?: string;
  qualifications: Qualification[];
  registrationNumber?: string;
  registrationAuthority?: string;
  credentialsVerified: boolean;
  experienceYears?: number | null;
  consultationFee?: number | null;
  featured: boolean;
  specialties: SpecialtyRef[];
  services: ServiceRef[];
  weekly: DaySchedule[];
}

export interface AdminDoctor extends Doctor {
  displayOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialtyDetail {
  specialty: Specialty;
  doctors: Doctor[];
  services: DentalService[];
}

export interface ServiceDetail {
  service: DentalService;
  doctors: Doctor[];
}

// ---------------------------------------------------------------- scheduling

export interface SlotView {
  time: string;
  endTime: string;
  available: boolean;
}

export interface DayAvailability {
  doctorId: number;
  date: string;
  open: boolean;
  reason?: string;
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  slotDurationMinutes?: number;
  appointmentMinutes?: number;
  slots: SlotView[];
}

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST';

export interface BlockView {
  id: number;
  doctorId?: number;
  doctorName?: string;
  clinicWide: boolean;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface SpecialHours {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  slotDurationMinutes: number;
  note?: string;
}

export interface DoctorSchedule {
  doctorId: number;
  weekly: DaySchedule[];
  specialHours: SpecialHours[];
  upcomingBlocks: BlockView[];
}

export interface DoctorRef {
  id: number;
  fullName: string;
  slug: string;
  professionalTitle: string;
}

export interface AdminDaySchedule {
  doctor: DoctorRef;
  date: string;
  open: boolean;
  reason?: string;
  startTime?: string;
  endTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  slotDurationMinutes?: number;
  slots: { time: string; endTime: string; status: SlotStatus; appointmentId?: number }[];
  appointments: Appointment[];
  blocks: BlockView[];
}

export interface WeeklyDay extends DaySchedule {
  doctorId: number;
}

export interface CalendarRange {
  from: string;
  to: string;
  doctors: DoctorRef[];
  appointments: Appointment[];
  blocks: BlockView[];
  weeklyHours: WeeklyDay[];
}

// ---------------------------------------------------------------- clinic & content

export interface ClinicSettings {
  clinicName: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  mapEmbedUrl?: string;
  openingTime: string;
  closingTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  workingDays: DayOfWeek[];
  slotDurationMinutes: number;
  bookingWindowDays: number;
  timezone: string;
  logoUrl?: string;
  tagline?: string;
  headerCtaText?: string;
  footerDescription?: string;
  copyrightText?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  googleReviewsUrl?: string;
  /** Google Maps share link (e.g. https://maps.app.goo.gl/...), used for "Get directions". */
  mapLinkUrl?: string;
}

export type ClinicSettingsPayload = Omit<ClinicSettings, 'timezone'>;

export interface NavigationItem {
  id?: number;
  label: string;
  url: string;
  displayOrder?: number;
  active: boolean;
  openInNewTab: boolean;
}

export interface Site {
  clinic: ClinicSettings;
  navigation: NavigationItem[];
}

export interface SectionItem {
  icon?: string;
  title?: string;
  text?: string;
  imageUrl?: string;
}

export interface Section {
  id: number;
  pageKey: PageKey;
  sectionKey: string;
  core: boolean;
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  primaryButtonLabel?: string;
  primaryButtonUrl?: string;
  secondaryButtonLabel?: string;
  secondaryButtonUrl?: string;
  items: SectionItem[];
  displayOrder: number;
  active: boolean;
  updatedAt?: string;
}

export type SectionPayload = Partial<Omit<Section, 'id' | 'pageKey' | 'core' | 'updatedAt'>>;

export interface Seo {
  pageKey: PageKey;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  indexable: boolean;
}

export interface PageContent {
  pageKey: PageKey;
  sections: Section[];
  seo: Seo;
}

export interface Testimonial {
  id: number;
  patientName: string;
  context?: string;
  quote: string;
  rating?: number | null;
  consentConfirmed: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface GalleryImage {
  id: number;
  imageUrl: string;
  caption?: string;
  category?: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------- appointments

export interface AppointmentRequest {
  fullName: string;
  phone: string;
  email?: string;
  serviceId: number;
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  message?: string;
  consent: boolean;
}

export interface BookingConfirmation {
  referenceId: number;
  status: AppointmentStatus;
  serviceName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  endTime: string;
}

export interface Appointment {
  id: number;
  patient: { id: number; fullName: string; phone: string; email?: string };
  service: { id: number; name: string; estimatedDuration: number; specialtyId: number; specialtyName: string };
  doctor: { id: number; fullName: string; slug: string };
  appointmentDate: string;
  appointmentTime: string;
  endTime: string;
  status: AppointmentStatus;
  message?: string;
  allowedTransitions: AppointmentStatus[];
  reschedulable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorStats {
  doctorId: number;
  doctorName: string;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
  today: number;
}

export interface AuditLog {
  id: number;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary?: string;
  createdAt: string;
}

export interface Dashboard {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  todaysAppointments: number;
  totalDoctors: number;
  totalSpecialties: number;
  totalServices: number;
  today: string;
  todaysSchedule: Appointment[];
  byDoctor: DoctorStats[];
  recentActivity: AuditLog[];
}

export interface Patient {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: string;
  appointmentCount: number;
}

export interface PatientDetail {
  patient: Patient;
  appointments: Appointment[];
}

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN';
}

export interface AuthPayload {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  admin: AdminProfile;
}

export interface AppointmentFilters {
  search?: string;
  status?: AppointmentStatus | '';
  doctorId?: number | '';
  specialtyId?: number | '';
  date?: string;
  page?: number;
  size?: number;
  sortBy?: 'appointmentDate' | 'createdAt' | 'status' | 'patientName' | 'doctorName';
  sortDir?: 'asc' | 'desc';
}

export interface ServicePayload {
  name: string;
  slug?: string;
  specialtyId: number;
  description: string;
  details: string[];
  icon?: string;
  imageUrl?: string;
  consultationFee?: number | null;
  estimatedDuration: number;
  displayOrder?: number;
  active?: boolean;
  doctorIds?: number[];
}

export interface SpecialtyPayload {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  displayOrder?: number;
  active?: boolean;
}

export interface DoctorPayload {
  fullName: string;
  slug?: string;
  professionalTitle: string;
  gender: Gender;
  profileImageUrl?: string;
  shortBio?: string;
  biography?: string;
  qualifications: Qualification[];
  registrationNumber?: string;
  registrationAuthority?: string;
  credentialsVerified: boolean;
  experienceYears?: number | null;
  consultationFee?: number | null;
  displayOrder?: number;
  active?: boolean;
  featured?: boolean;
  specialtyIds: number[];
  serviceIds: number[];
}

export interface BlockPayload {
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface AdminAppointmentPayload {
  doctorId: number;
  serviceId: number;
  appointmentDate: string;
  appointmentTime: string;
  fullName: string;
  phone: string;
  email?: string;
  message?: string;
  initialStatus: 'PENDING' | 'CONFIRMED';
}
