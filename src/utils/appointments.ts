import type { PatientAppointment } from '../types';

type Timed = Pick<PatientAppointment, 'appointmentDate' | 'appointmentTime' | 'endTime' | 'status'>;

/** Start of the appointment as epoch ms (date and time are clinic-local). */
export const appointmentStart = (a: Timed) => new Date(`${a.appointmentDate}T${a.appointmentTime}`).getTime();

/** End of the appointment as epoch ms; falls back to the start time if no end time is known. */
export const appointmentEnd = (a: Timed) => (a.endTime ? new Date(`${a.appointmentDate}T${a.endTime}`).getTime() : appointmentStart(a));

/** Still to come (or in progress): pending/confirmed and its end time hasn't passed. */
export const isUpcoming = (a: Timed, now: number = Date.now()) =>
  (a.status === 'PENDING' || a.status === 'CONFIRMED') && appointmentEnd(a) > now;
