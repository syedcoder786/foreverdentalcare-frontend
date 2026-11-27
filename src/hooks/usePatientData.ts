import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PatientBookingRequest } from '../types';
import { patientApi } from '../services/patientApi';
import { usePatientAuth } from '../context/PatientAuthContext';

export const patientKeys = {
  appointments: ['patient', 'appointments'] as const,
};

export function usePatientAppointments() {
  const { status } = usePatientAuth();
  return useQuery({ queryKey: patientKeys.appointments, queryFn: patientApi.appointments, enabled: status === 'authenticated' });
}

export function usePatientBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatientBookingRequest) => patientApi.book(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['public', 'availability'] });
      queryClient.invalidateQueries({ queryKey: patientKeys.appointments });
    },
  });
}

export function useUpdatePatientProfile() {
  const { setPatient } = usePatientAuth();
  return useMutation({
    mutationFn: ({ fullName, email, whatsappOptIn }: { fullName: string; email?: string; whatsappOptIn?: boolean }) =>
      patientApi.updateMe(fullName, email, whatsappOptIn),
    onSuccess: (profile) => setPatient(profile),
  });
}
