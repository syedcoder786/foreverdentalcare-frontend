import type { ClinicSettings } from '../types';

/**
 * Minimal values shown ONLY while the API is loading or unreachable. All real website content (text, doctors,
 * services, images, navigation, footer...) is managed from the admin dashboard and served by the backend.
 */
export const fallbackClinic: ClinicSettings = {
  clinicName: 'Our Clinic',
  address: '',
  phone: '',
  openingTime: '10:00',
  closingTime: '18:00',
  workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  slotDurationMinutes: 30,
  bookingWindowDays: 60,
  timezone: 'Asia/Kolkata',
};
