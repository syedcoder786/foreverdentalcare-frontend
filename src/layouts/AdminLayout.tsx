import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '../components/admin/Sidebar';
import { Topbar } from '../components/admin/Topbar';
import { AnimatedOutlet } from '../components/motion/AnimatedOutlet';
import { ScrollToTop } from '../components/layout/ScrollToTop';
import { AdminPageSkeleton } from '../components/ui/Skeletons';

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/doctors': 'Doctors',
  '/admin/specialties': 'Specialties',
  '/admin/services': 'Services',
  '/admin/appointments': 'Appointments',
  '/admin/patients': 'Patients',
  '/admin/content': 'Website content',
  '/admin/homepage': 'Homepage editor',
  '/admin/testimonials': 'Testimonials',
  '/admin/gallery': 'Gallery',
  '/admin/seo': 'SEO settings',
  '/admin/whatsapp': 'WhatsApp',
  '/admin/settings': 'Clinic settings',
  '/admin/database': 'Database',
  '/admin/storage': 'Image storage',
};

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const path = pathname.replace(/\/$/, '');
  const title = TITLES[path] ?? (path.startsWith('/admin/doctors/') ? 'Doctor' : 'Admin');

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-canvas">
      <ScrollToTop />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-72">
        <Topbar title={title} onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <AnimatedOutlet offset={10} fallback={<AdminPageSkeleton />} />
        </main>
      </div>
    </div>
  );
}
