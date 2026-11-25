import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicApi } from '../services/publicApi';
import { fallbackClinic } from '../config/fallbacks';
import type { AppointmentRequest, PageKey, Section } from '../types';

const FIVE_MIN = 5 * 60 * 1000;

export const publicKeys = {
  site: ['public', 'site'] as const,
  page: (key: PageKey) => ['public', 'page', key] as const,
  specialties: ['public', 'specialties'] as const,
  specialty: (slug: string) => ['public', 'specialty', slug] as const,
  services: (filters?: object) => ['public', 'services', filters ?? {}] as const,
  service: (slug: string) => ['public', 'service', slug] as const,
  doctors: (specialtyId?: number) => ['public', 'doctors', specialtyId ?? 'all'] as const,
  doctor: (slug: string) => ['public', 'doctor', slug] as const,
  doctorServices: (doctorId: number, specialtyId?: number) => ['public', 'doctor-services', doctorId, specialtyId ?? 'all'] as const,
  availability: (doctorId: number, date: string, serviceId?: number) => ['public', 'availability', doctorId, date, serviceId ?? 0] as const,
  testimonials: ['public', 'testimonials'] as const,
  gallery: ['public', 'gallery'] as const,
};

/** Clinic settings + navigation, with a minimal fallback so the layout still renders if the API is down. */
export function useSite() {
  const query = useQuery({ queryKey: publicKeys.site, queryFn: publicApi.getSite, staleTime: FIVE_MIN });
  return {
    ...query,
    clinic: query.data?.clinic ?? fallbackClinic,
    navigation: query.data?.navigation ?? [],
    isFallback: !query.data,
  };
}

/** Backwards-compatible alias used across the app. */
export const useClinic = useSite;

/** All active sections of a page, plus a lookup by section key and the page's SEO settings. */
export function usePage(pageKey: PageKey) {
  const query = useQuery({ queryKey: publicKeys.page(pageKey), queryFn: () => publicApi.getPage(pageKey), staleTime: FIVE_MIN });
  const sections = query.data?.sections ?? [];
  const byKey = (key: string): Section | undefined => sections.find((s) => s.sectionKey === key);
  return { ...query, sections, section: byKey, seo: query.data?.seo };
}

export function useSpecialties() {
  return useQuery({ queryKey: publicKeys.specialties, queryFn: publicApi.getSpecialties, staleTime: FIVE_MIN });
}

export function useSpecialty(slug: string | undefined) {
  return useQuery({
    queryKey: publicKeys.specialty(slug ?? ''),
    queryFn: () => publicApi.getSpecialty(slug as string),
    enabled: Boolean(slug),
  });
}

export function useServices(filters?: { specialtyId?: number; doctorId?: number }) {
  return useQuery({ queryKey: publicKeys.services(filters), queryFn: () => publicApi.getServices(filters), staleTime: FIVE_MIN });
}

export function useService(slug: string | undefined) {
  return useQuery({ queryKey: publicKeys.service(slug ?? ''), queryFn: () => publicApi.getService(slug as string), enabled: Boolean(slug) });
}

export function useDoctors(specialtyId?: number) {
  return useQuery({ queryKey: publicKeys.doctors(specialtyId), queryFn: () => publicApi.getDoctors(specialtyId), staleTime: FIVE_MIN });
}

export function useDoctor(slug: string | undefined) {
  return useQuery({ queryKey: publicKeys.doctor(slug ?? ''), queryFn: () => publicApi.getDoctorBySlug(slug as string), enabled: Boolean(slug) });
}

export function useDoctorServices(doctorId: number | undefined, specialtyId?: number) {
  return useQuery({
    queryKey: publicKeys.doctorServices(doctorId ?? 0, specialtyId),
    queryFn: () => publicApi.getDoctorServices(doctorId as number, specialtyId),
    enabled: Boolean(doctorId),
  });
}

/** A doctor's availability for a date, sized for the selected service's duration. */
export function useAvailability(doctorId: number | undefined, date: string | undefined, serviceId?: number) {
  return useQuery({
    queryKey: publicKeys.availability(doctorId ?? 0, date ?? '', serviceId),
    queryFn: () => publicApi.getDoctorAvailability(doctorId as number, date as string, serviceId),
    enabled: Boolean(doctorId && date),
    staleTime: 30 * 1000,
  });
}

export function useTestimonials() {
  return useQuery({ queryKey: publicKeys.testimonials, queryFn: publicApi.getTestimonials, staleTime: FIVE_MIN });
}

export function useGallery() {
  return useQuery({ queryKey: publicKeys.gallery, queryFn: publicApi.getGallery, staleTime: FIVE_MIN });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AppointmentRequest) => publicApi.requestAppointment(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'availability'] });
    },
  });
}
