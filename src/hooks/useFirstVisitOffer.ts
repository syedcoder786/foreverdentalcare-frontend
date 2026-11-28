import { useDoctors, useSite } from './usePublicData';
import { usePatientAppointments } from './usePatientData';
import { usePatientAuth } from '../context/PatientAuthContext';

export interface FirstVisitOffer {
  /** Percent off the consultation fee (each treatment / doctor has its own fee). */
  percent: number;
  /** The signed-in patient already has a pending online booking carrying the discount; a new booking won't get it. */
  pendingFirst: boolean;
}

/**
 * The online first-visit offer, or null when it should not be shown.
 *
 * Shown when the clinic has enabled it (Admin -> Clinic settings), at least one doctor has a consultation fee (the
 * discount is a percentage of that fee, so it can't apply without one) and the visitor has never had a confirmed or
 * completed appointment. Anonymous visitors see it too (they can only book after signing in, and the server decides
 * eligibility). Once an appointment is confirmed it disappears; if that appointment is cancelled, it returns.
 */
export function useFirstVisitOffer(): FirstVisitOffer | null {
  const { clinic } = useSite();
  const { status } = usePatientAuth();
  const appointments = usePatientAppointments();
  const doctors = useDoctors();

  const percent = clinic.firstVisitDiscountPercent;
  if (!clinic.firstVisitOfferEnabled || !percent) return null;
  if (status === 'loading') return null;
  if (!(doctors.data ?? []).some((d) => hasFee(d.consultationFee))) return null;

  let pendingFirst = false;
  if (status === 'authenticated') {
    const list = appointments.data;
    if (!list) return null; // still loading: avoid flashing an offer the patient may not have
    if (list.some((a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED')) return null;
    pendingFirst = list.some((a) => a.status === 'PENDING' && a.firstVisitDiscountPercent != null);
  }

  return { percent, pendingFirst };
}

/** The discount needs a fee to take a percentage of. */
export function hasFee(fee?: number | null): fee is number {
  return fee != null && fee > 0;
}

/** Fee after a percent discount, rounded to the rupee. */
export function discountedFee(fee: number, percent: number): number {
  return Math.round((fee * (100 - percent)) / 100);
}
