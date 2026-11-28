import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { FaFacebookF, FaGoogle, FaInstagram, FaYoutube } from 'react-icons/fa6';
import { Logo } from './Logo';
import { SmartLink } from '../content/Cms';
import { useSite } from '../../hooks/usePublicData';
import { formatPhone, formatWorkingDays, telHref } from '../../utils/format';
import { clinicHours } from '../../utils/clinicHours';
import { ClinicHours } from '../ui/ShiftHours';

/** Footer content (description, social links, copyright, contact, hours) is managed in Admin -> Clinic settings. */
export function Footer() {
  const { clinic, navigation } = useSite();
  const year = new Date().getFullYear();
  const social = [
    { href: clinic.instagramUrl, label: 'Instagram', icon: FaInstagram },
    { href: clinic.facebookUrl, label: 'Facebook', icon: FaFacebookF },
    { href: clinic.youtubeUrl, label: 'YouTube', icon: FaYoutube },
    { href: clinic.googleReviewsUrl, label: 'Google reviews', icon: FaGoogle },
  ].filter((s) => Boolean(s.href));

  return (
    <footer className="relative bg-brand-900 text-mint dark:bg-[#03100f] dark:shadow-[inset_0_1px_0_rgb(89_214_196/0.15)]">
      <div className="container-page grid grid-cols-1 gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <Logo light />
          {clinic.footerDescription && <p className="text-sm leading-relaxed text-mint/80">{clinic.footerDescription}</p>}
          {social.length > 0 && (
            <div className="flex gap-2">
              {social.map(({ href, label, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="rounded-full bg-white/10 p-2.5 transition hover:bg-white/20">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            {navigation.map((item) => (
              <li key={item.id ?? item.url}>
                <SmartLink to={item.url} className="text-mint/80 transition hover:text-white">
                  {item.label}
                </SmartLink>
              </li>
            ))}
            <li>
              <SmartLink to="/book" className="text-mint/80 transition hover:text-white">
                Book an appointment
              </SmartLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">Contact</h3>
          <ul className="space-y-3 text-sm">
            {clinic.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                <span className="text-mint/80">{clinic.address}</span>
              </li>
            )}
            {clinic.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                <a href={telHref(clinic.phone)} className="text-mint/80 hover:text-white">
                  {formatPhone(clinic.phone)}
                </a>
              </li>
            )}
            {clinic.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
                <a href={`mailto:${clinic.email}`} className="break-all text-mint/80 hover:text-white">
                  {clinic.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">Clinic hours</h3>
          <div className="flex gap-3 text-sm">
            <Clock className="mt-0.5 size-4 shrink-0 text-brand-300" aria-hidden />
            <div className="space-y-1 text-mint/80">
              <p className="font-medium text-white">{formatWorkingDays(clinic.workingDays)}</p>
              <ClinicHours hours={clinicHours(clinic)} />
              <p className="text-mint/60">Each doctor&apos;s consultation hours are shown on their profile.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-mint/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {clinic.clinicName}. {clinic.copyrightText}
          </p>
          <p>Information on this website is general and is not a substitute for a consultation.</p>
        </div>
      </div>
    </footer>
  );
}
