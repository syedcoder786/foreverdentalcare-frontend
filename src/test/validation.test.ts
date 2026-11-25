import { describe, expect, it } from 'vitest';
import { createAppointmentSchema, loginSchema, serviceSchema, settingsSchema } from '../utils/validation';

const TODAY = '2026-12-02';
const schema = createAppointmentSchema(TODAY);

const valid = {
  fullName: 'Asha Rao',
  phone: '+91 98765 43210',
  email: '',
  specialtyId: '1',
  doctorId: '1',
  serviceId: '1',
  appointmentDate: '2026-12-03',
  appointmentTime: '10:00',
  message: '',
  consent: true,
};

function errorsFor(data: unknown) {
  const result = schema.safeParse(data);
  return result.success ? {} : result.error.flatten().fieldErrors;
}

describe('appointment form schema', () => {
  it('accepts a valid request', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('accepts today as a date', () => {
    expect(schema.safeParse({ ...valid, appointmentDate: TODAY }).success).toBe(true);
  });

  it('requires a name', () => {
    expect(errorsFor({ ...valid, fullName: '   ' }).fullName?.[0]).toMatch(/full name/i);
  });

  it.each(['12345', 'abc-def-ghij', '+91 123', '1234567890123456789'])('rejects invalid phone %s', (phone) => {
    expect(errorsFor({ ...valid, phone }).phone).toBeDefined();
  });

  it.each(['9876543210', '+919876543210', '(022) 2345-6789', '+44 20 7946 0958'])('accepts valid phone %s', (phone) => {
    expect(errorsFor({ ...valid, phone }).phone).toBeUndefined();
  });

  it('rejects a date in the past', () => {
    expect(errorsFor({ ...valid, appointmentDate: '2026-12-01' }).appointmentDate?.[0]).toMatch(/past/i);
  });

  it('requires treatment, date, time and consent', () => {
    const errors = errorsFor({ ...valid, serviceId: '', appointmentDate: '', appointmentTime: '', consent: false });
    expect(errors.serviceId).toBeDefined();
    expect(errors.appointmentDate).toBeDefined();
    expect(errors.appointmentTime).toBeDefined();
    expect(errors.consent).toBeDefined();
  });

  it('email is optional but must be valid when provided', () => {
    expect(errorsFor({ ...valid, email: 'not-an-email' }).email).toBeDefined();
    expect(errorsFor({ ...valid, email: 'asha@example.com' }).email).toBeUndefined();
  });
});

describe('other schemas', () => {
  it('login requires a valid email and password', () => {
    expect(loginSchema.safeParse({ email: 'x', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'secret' }).success).toBe(true);
  });

  it('service fee must be a non-negative amount', () => {
    const base = { name: 'X', description: 'Y', estimatedDuration: '30', displayOrder: '0', active: true, specialtyId: '1', doctorIds: [] };
    expect(serviceSchema.safeParse({ ...base, consultationFee: '-5' }).success).toBe(false);
    expect(serviceSchema.safeParse({ ...base, consultationFee: '499.50' }).success).toBe(true);
    expect(serviceSchema.safeParse({ ...base, consultationFee: '' }).success).toBe(true);
  });

  it('settings closing time must be after opening time', () => {
    const base = {
      clinicName: 'C',
      address: 'A',
      phone: '9876543210',
      whatsappNumber: '',
      email: '',
      mapEmbedUrl: '',
      openingTime: '10:00',
      closingTime: '09:00',
      breakStartTime: '',
      breakEndTime: '',
      workingDays: ['MONDAY'],
      slotDurationMinutes: '30',
      bookingWindowDays: '30',
    };
    const result = settingsSchema.safeParse(base);
    expect(result.success).toBe(false);
    expect(result.success || result.error.flatten().fieldErrors.closingTime).toBeTruthy();
  });
});
