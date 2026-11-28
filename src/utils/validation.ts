import { extractEmbedSrc } from './maps';
import { z } from 'zod';

/** Same rule as the backend: optional '+', 10-15 digits, spaces/dashes/parentheses allowed. */
export const PHONE_REGEX = /^\+?(?:[\s()-]*\d){10,15}[\s()-]*$/;

/** Builds the appointment form schema. `today` is YYYY-MM-DD in the clinic timezone. */
export function createAppointmentSchema(today: string) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Please enter your full name')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),
    phone: z
      .string()
      .trim()
      .min(1, 'Please enter your phone number')
      .regex(PHONE_REGEX, 'Please enter a valid phone number (10-15 digits)'),
    email: z
      .string()
      .trim()
      .max(150, 'Email must be at most 150 characters')
      .email('Please enter a valid email address')
      .or(z.literal(''))
      .optional(),
    specialtyId: z.string().min(1, 'Please choose a specialty'),
    doctorId: z.string().min(1, 'Please choose a doctor'),
    serviceId: z.string().min(1, 'Please select a treatment'),
    appointmentDate: z
      .string()
      .min(1, 'Please choose a preferred date')
      .refine((d) => d >= today, 'Appointment date cannot be in the past'),
    appointmentTime: z.string().min(1, 'Please choose a preferred time'),
    message: z.string().max(1000, 'Message must be at most 1000 characters').optional(),
    consent: z.boolean().refine((v) => v, 'Please give consent so we can process your request'),
  });
}

export type AppointmentFormValues = z.infer<ReturnType<typeof createAppointmentSchema>>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Numeric form inputs are kept as strings in the form and converted on submit. */
function intString(min: number, max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => /^\d+$/.test(v), `${label} must be a whole number`)
    .refine((v) => Number(v) >= min && Number(v) <= max, `${label} must be between ${min} and ${max}`);
}

export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug: z.string().trim().regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, 'Lowercase letters, numbers and dashes only').optional(),
  specialtyId: z.string().min(1, 'Select a specialty'),
  doctorIds: z.array(z.string()),
  imageUrl: z.string().optional(),
  description: z.string().trim().min(1, 'Description is required').max(1000),
  detailsText: z.string().max(2000).optional(),
  icon: z.string().optional(),
  consultationFee: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0), 'Enter a valid fee (e.g. 500 or 499.50)'),
  estimatedDuration: intString(5, 480, 'Duration'),
  displayOrder: intString(0, 9999, 'Display order'),
  active: z.boolean(),
  offerEnabled: z.boolean(),
  offerDiscountPercent: z.string().trim(),
  offerStartDate: z.string(),
  offerEndDate: z.string(),
}).superRefine((v, ctx) => {
  if (!v.offerEnabled) return;
  const pct = Number(v.offerDiscountPercent);
  if (!/^\d+$/.test(v.offerDiscountPercent) || pct < 1 || pct > 100) {
    ctx.addIssue({ code: 'custom', path: ['offerDiscountPercent'], message: 'Enter a whole number from 1 to 100' });
  }
  if (!v.offerStartDate) ctx.addIssue({ code: 'custom', path: ['offerStartDate'], message: 'Choose when the offer starts' });
  if (!v.offerEndDate) ctx.addIssue({ code: 'custom', path: ['offerEndDate'], message: 'Choose when the offer ends' });
  if (v.offerStartDate && v.offerEndDate && v.offerEndDate < v.offerStartDate) {
    ctx.addIssue({ code: 'custom', path: ['offerEndDate'], message: 'The offer must end on or after its start date' });
  }
  if (!v.consultationFee || Number(v.consultationFee) <= 0) {
    ctx.addIssue({ code: 'custom', path: ['consultationFee'], message: 'Set a fee for this treatment to give a percentage off' });
  }
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

export const settingsSchema = z
  .object({
    clinicName: z.string().trim().min(1, 'Clinic name is required').max(150),
    address: z.string().trim().min(1, 'Address is required').max(300),
    phone: z.string().trim().regex(PHONE_REGEX, 'Enter a valid phone number'),
    whatsappNumber: z.string().trim().regex(PHONE_REGEX, 'Enter a valid WhatsApp number').or(z.literal('')),
    email: z.string().trim().email('Enter a valid email').or(z.literal('')),
    mapEmbedUrl: z
      .string()
      .transform(extractEmbedSrc)
      .pipe(z.string().regex(/^https:\/\/www\.google\.com\/maps\/embed\?.+/, 'Must be a Google Maps embed URL (https://www.google.com/maps/embed?...)').or(z.literal(''))),
    mapLinkUrl: z
      .string()
      .trim()
      .max(500)
      .regex(/^https:\/\/\S+$/, 'Use a full https:// link')
      .refine((v) => !/goo\.gl\//i.test(v), 'Short maps.app.goo.gl links do not open on every network. Use the full google.com/maps link.')
      .or(z.literal('')),
    openingTime: z.string().regex(timeRegex, 'Required'),
    closingTime: z.string().regex(timeRegex, 'Required'),
    breakStartTime: z.string().regex(timeRegex).or(z.literal('')),
    breakEndTime: z.string().regex(timeRegex).or(z.literal('')),
    workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
    slotDurationMinutes: intString(5, 240, 'Slot duration'),
    bookingWindowDays: intString(1, 365, 'Booking window'),
    firstVisitDiscountPercent: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\d+$/.test(v), 'Discount must be a whole number')
      .refine((v) => v === '' || (Number(v) >= 1 && Number(v) <= 100), 'Discount must be between 1 and 100'),
    firstVisitOfferEnabled: z.boolean(),
  })
  .refine((v) => !v.firstVisitOfferEnabled || v.firstVisitDiscountPercent !== '', {
    path: ['firstVisitDiscountPercent'],
    message: 'Set the first-visit discount',
  })
  .refine((v) => v.closingTime > v.openingTime, {
    path: ['closingTime'],
    message: 'Closing time must be after opening time',
  })
  .refine((v) => !v.breakStartTime === !v.breakEndTime, {
    path: ['breakEndTime'],
    message: 'Provide both break start and end, or neither',
  })
  .refine((v) => !v.breakStartTime || !v.breakEndTime || v.breakEndTime > v.breakStartTime, {
    path: ['breakEndTime'],
    message: 'Break end must be after break start',
  });

export type SettingsFormValues = z.infer<typeof settingsSchema>;
