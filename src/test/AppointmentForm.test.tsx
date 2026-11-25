import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { AppointmentForm } from '../components/appointment/AppointmentForm';
import { publicApi } from '../services/publicApi';
import { renderWithProviders } from './utils';
import { addDays, todayInZone } from '../utils/dates';
import type { DayAvailability, Doctor, ServiceRef, Specialty } from '../types';

vi.mock('../services/publicApi', () => ({
  publicApi: {
    getSpecialties: vi.fn(),
    getDoctors: vi.fn(),
    getDoctorServices: vi.fn(),
    getDoctorAvailability: vi.fn(),
    requestAppointment: vi.fn(),
  },
}));

const api = vi.mocked(publicApi);
const clinic = { timezone: 'Asia/Kolkata', bookingWindowDays: 60, clinicName: 'Test Clinic', phone: '+919999999999' };
const DATE = addDays(todayInZone(clinic.timezone), 3);

const specialties: Specialty[] = [
  { id: 1, name: 'Dentistry', slug: 'dentistry', displayOrder: 1, active: true, doctorCount: 1, serviceCount: 2 },
  { id: 2, name: 'Unani Medicine', slug: 'unani-medicine', displayOrder: 2, active: true, doctorCount: 1, serviceCount: 1 },
];

function doctor(id: number, name: string, slug: string, specialty: Specialty): Doctor {
  return {
    id, fullName: name, slug, professionalTitle: 'Practitioner', gender: 'UNSPECIFIED', qualifications: [], credentialsVerified: false,
    featured: true, specialties: [{ id: specialty.id, name: specialty.name, slug: specialty.slug }], services: [], weekly: [],
  };
}
const dentist = doctor(10, 'Dr. Dentist', 'dr-dentist', specialties[0]);
const unani = doctor(20, 'Dr. Unani', 'dr-unani', specialties[1]);

const dentalServices: ServiceRef[] = [
  { id: 100, name: 'Teeth Cleaning', slug: 'teeth-cleaning', specialtyId: 1, specialtyName: 'Dentistry', estimatedDuration: 45, active: true },
  { id: 101, name: 'Root Canal Treatment', slug: 'root-canal', specialtyId: 1, specialtyName: 'Dentistry', estimatedDuration: 60, active: true },
];
const unaniServices: ServiceRef[] = [
  { id: 200, name: 'Unani Consultation', slug: 'unani-consultation', specialtyId: 2, specialtyName: 'Unani Medicine', estimatedDuration: 30, active: true },
];

const availability: DayAvailability = {
  doctorId: 10, date: DATE, open: true, startTime: '10:00', endTime: '14:00', slotDurationMinutes: 30, appointmentMinutes: 60,
  slots: [
    { time: '10:00', endTime: '11:00', available: true },
    { time: '10:30', endTime: '11:30', available: false },
    { time: '11:00', endTime: '12:00', available: true },
  ],
};

function httpError(status: number, data: unknown) {
  const response = { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } } as AxiosResponse;
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', undefined, undefined, response);
}

async function walkToDetails() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Dentistry' }));
  await user.click(await screen.findByRole('button', { name: /dr\. dentist/i }));
  await user.click(await screen.findByRole('button', { name: 'Root Canal Treatment' }));
  fireEvent.change(screen.getByLabelText(/preferred date/i), { target: { value: DATE } });
  await user.click(await screen.findByRole('button', { name: '10:00 AM' }));
  await user.type(screen.getByLabelText(/full name/i), 'Asha Rao');
  await user.type(screen.getByLabelText(/phone number/i), '+91 98765 43210');
  await user.click(screen.getByLabelText(/i agree/i));
  return user;
}

describe('AppointmentForm (multi-doctor booking)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getSpecialties.mockResolvedValue(specialties);
    api.getDoctors.mockImplementation(async (specialtyId?: number) =>
      specialtyId === 1 ? [dentist] : specialtyId === 2 ? [unani] : [dentist, unani]);
    api.getDoctorServices.mockImplementation(async (doctorId: number) => (doctorId === 10 ? dentalServices : unaniServices));
    api.getDoctorAvailability.mockResolvedValue(availability);
  });

  it('only offers the selected doctor\'s services', async () => {
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Unani Medicine' }));
    // Single doctor in the specialty is auto-selected.
    expect(await screen.findByRole('button', { name: 'Unani Consultation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Teeth Cleaning' })).not.toBeInTheDocument();
    expect(api.getDoctorServices).toHaveBeenCalledWith(20, 2);
  });

  it('fetches slots for the chosen doctor and service and hides booked slots', async () => {
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Dentistry' }));
    await user.click(await screen.findByRole('button', { name: 'Root Canal Treatment' }));
    fireEvent.change(screen.getByLabelText(/preferred date/i), { target: { value: DATE } });
    expect(await screen.findByRole('button', { name: '10:00 AM' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '10:30 AM' })).not.toBeInTheDocument();
    expect(api.getDoctorAvailability).toHaveBeenCalledWith(10, DATE, 101);
  });

  it('pre-selects specialty, doctor and service from a link', async () => {
    renderWithProviders(<AppointmentForm clinic={clinic} prefill={{ doctor: 'dr-dentist', service: 'teeth-cleaning' }} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Teeth Cleaning' })).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByRole('button', { name: /dr\. dentist/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dentistry' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows validation errors and does not submit an empty form', async () => {
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    await screen.findByRole('button', { name: 'Dentistry' });
    await userEvent.click(screen.getByRole('button', { name: /request appointment/i }));
    expect(await screen.findByText(/please choose a specialty/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/please give consent/i)).toBeInTheDocument();
    expect(api.requestAppointment).not.toHaveBeenCalled();
  });

  it('submits doctor and service and shows the pending confirmation', async () => {
    api.requestAppointment.mockResolvedValue({
      referenceId: 42, status: 'PENDING', serviceName: 'Root Canal Treatment', doctorName: 'Dr. Dentist',
      appointmentDate: DATE, appointmentTime: '10:00', endTime: '11:00',
    });
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    const user = await walkToDetails();
    await user.click(screen.getByRole('button', { name: /request appointment/i }));

    expect(await screen.findByText(/request received/i)).toBeInTheDocument();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('Dr. Dentist')).toBeInTheDocument();
    expect(api.requestAppointment).toHaveBeenCalledWith(
      expect.objectContaining({ doctorId: 10, serviceId: 101, appointmentDate: DATE, appointmentTime: '10:00', consent: true }),
    );
  });

  it('handles a slot conflict (409) from the API', async () => {
    api.requestAppointment.mockRejectedValue(httpError(409, { success: false, message: 'This time slot has just been booked. Please choose another time.' }));
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    const user = await walkToDetails();
    await user.click(screen.getByRole('button', { name: /request appointment/i }));
    expect(await screen.findByText(/just been booked/i)).toBeInTheDocument();
    expect(screen.getByText(/review the highlighted fields/i)).toBeInTheDocument();
  });

  it('maps server field errors onto the form', async () => {
    api.requestAppointment.mockRejectedValue(httpError(422, { success: false, message: 'Not available', errors: { appointmentTime: 'The doctor is not available at this time' } }));
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    const user = await walkToDetails();
    await user.click(screen.getByRole('button', { name: /request appointment/i }));
    expect(await screen.findByText('The doctor is not available at this time')).toBeInTheDocument();
  });

  it('shows a friendly message when the server is unreachable', async () => {
    api.requestAppointment.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    const user = await walkToDetails();
    await user.click(screen.getByRole('button', { name: /request appointment/i }));
    await waitFor(() => expect(screen.getByText(/unable to reach the server/i)).toBeInTheDocument());
  });

  it('explains when the doctor is unavailable on the chosen date', async () => {
    api.getDoctorAvailability.mockResolvedValue({ ...availability, open: false, reason: 'On leave', slots: [] });
    renderWithProviders(<AppointmentForm clinic={clinic} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Dentistry' }));
    await user.click(await screen.findByRole('button', { name: 'Teeth Cleaning' }));
    fireEvent.change(screen.getByLabelText(/preferred date/i), { target: { value: DATE } });
    expect(await screen.findByText(/on leave/i)).toBeInTheDocument();
  });
});
