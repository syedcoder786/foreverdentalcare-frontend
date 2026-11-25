import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarPlus, Menu, Phone, X } from 'lucide-react';
import { Logo } from './Logo';
import { LinkButton } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useClinic } from '../../hooks/usePublicData';
import { formatPhone, telHref } from '../../utils/format';
import { cn } from '../../utils/cn';
import { EASE_OUT } from '../motion/Reveal';

/** Fallback menu while the site settings load (the real menu is managed in Admin -> Website content). */
const DEFAULT_LINKS = [
  { to: '/', label: 'Home', external: false, newTab: false },
  { to: '/doctors', label: 'Our Doctors', external: false, newTab: false },
  { to: '/services', label: 'Treatments', external: false, newTab: false },
  { to: '/contact', label: 'Contact', external: false, newTab: false },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { clinic, navigation, isFallback } = useClinic();
  const links = isFallback
    ? DEFAULT_LINKS
    : navigation.map((n) => ({ to: n.url, label: n.label, external: !n.url.startsWith('/'), newTab: n.openInNewTab }));
  const ctaText = clinic.headerCtaText || 'Book appointment';
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300',
        scrolled || open
          ? 'border-b border-slate-200/70 bg-surface/80 shadow-soft backdrop-blur-xl dark:border-white/5 dark:bg-surface/60'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.to}
                href={l.to}
                {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            ) : (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-brand-800' : 'text-slate-600 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-brand-50 ring-1 ring-brand-100 dark:ring-brand-400/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {l.label}
                </>
              )}
            </NavLink>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={telHref(clinic.phone)} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700">
            <Phone className="size-4" aria-hidden />
            {formatPhone(clinic.phone)}
          </a>
          <ThemeToggle />
          <LinkButton to="/book" size="sm" icon={<CalendarPlus className="size-4" aria-hidden />}>
            {ctaText}
          </LinkButton>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="-mr-2 rounded-full p-2.5 text-ink hover:bg-slate-100"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'open'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex"
              >
                {open ? <X className="size-6" /> : <Menu className="size-6" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="overflow-hidden border-t border-slate-100 lg:hidden"
          >
            <motion.nav
              aria-label="Mobile"
              className="container-page flex flex-col gap-1 py-4"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
            >
              {links.map((l) => (
                <motion.div key={l.to} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
                  {l.external ? (
                    <a
                      href={l.to}
                      {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="block rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <NavLink
                      to={l.to}
                      end={l.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-xl px-4 py-3 text-base font-medium',
                          isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50',
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  )}
                </motion.div>
              ))}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="mt-3 grid gap-2 sm:grid-cols-2"
              >
                <LinkButton href={telHref(clinic.phone)} variant="outline" icon={<Phone className="size-4" aria-hidden />}>
                  Call {formatPhone(clinic.phone)}
                </LinkButton>
                <LinkButton to="/book" icon={<CalendarPlus className="size-4" aria-hidden />}>
                  {ctaText}
                </LinkButton>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
