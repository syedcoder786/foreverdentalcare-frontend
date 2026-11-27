import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Home,
  Images,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Search,
  Settings,
  Stethoscope,
  UserRound,
  Users,
  X,
  MessageCircle,
} from 'lucide-react';
import { ToothMark } from '../layout/Logo';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../hooks/usePublicData';
import { cn } from '../../utils/cn';

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/doctors', label: 'Doctors', icon: UserRound },
  { to: '/admin/specialties', label: 'Specialties', icon: Layers },
  { to: '/admin/services', label: 'Services', icon: Stethoscope },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/admin/patients', label: 'Patients', icon: Users },
  { to: '/admin/content', label: 'Website content', icon: FileText },
  { to: '/admin/homepage', label: 'Homepage editor', icon: Home },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/seo', label: 'SEO settings', icon: Search },
  { to: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { to: '/admin/settings', label: 'Clinic settings', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { clinic: { clinicName } } = useSite();
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-900 text-mint transition-transform duration-300 ease-out lg:translate-x-0',
          'dark:bg-[#03100f] dark:shadow-[inset_-1px_0_0_rgb(89_214_196/0.12)]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <ToothMark className="size-8" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">{clinicName}</p>
              <p className="text-[11px] text-brand-200/70">Admin dashboard</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-brand-200 hover:bg-white/10 lg:hidden" aria-label="Close navigation">
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'text-white' : 'text-mint/75 hover:bg-white/6 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-xl bg-white/12 ring-1 ring-white/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    >
                      <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-300" />
                    </motion.span>
                  )}
                  <Icon className="relative size-5" aria-hidden />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-mint/75 hover:bg-white/6 hover:text-white"
          >
            <ExternalLink className="size-5" aria-hidden />
            View website
          </a>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-mint/75 hover:bg-white/6 hover:text-white"
          >
            <LogOut className="size-5" aria-hidden />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
