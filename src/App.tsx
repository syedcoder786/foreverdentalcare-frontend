import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { PageLoader } from './components/ui/Spinner';
import Home from './pages/Home';

// Route-level code splitting keeps the public bundle small; admin code loads only when needed.
const About = lazy(() => import('./pages/About'));
const Doctors = lazy(() => import('./pages/Doctors'));
const DoctorProfile = lazy(() => import('./pages/DoctorProfile'));
const Specialties = lazy(() => import('./pages/Specialties'));
const SpecialtyDetail = lazy(() => import('./pages/SpecialtyDetail'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const DoctorsAdmin = lazy(() => import('./pages/admin/DoctorsAdmin'));
const DoctorEditor = lazy(() => import('./pages/admin/DoctorEditor'));
const SpecialtiesAdmin = lazy(() => import('./pages/admin/SpecialtiesAdmin'));
const ServicesAdmin = lazy(() => import('./pages/admin/ServicesAdmin'));
const Appointments = lazy(() => import('./pages/admin/Appointments'));
const PatientsAdmin = lazy(() => import('./pages/admin/PatientsAdmin'));
const WebsiteContent = lazy(() => import('./pages/admin/WebsiteContent'));
const HomepageEditor = lazy(() => import('./pages/admin/HomepageEditor'));
const TestimonialsAdmin = lazy(() => import('./pages/admin/TestimonialsAdmin'));
const GalleryAdmin = lazy(() => import('./pages/admin/GalleryAdmin'));
const SeoAdmin = lazy(() => import('./pages/admin/SeoAdmin'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const WhatsAppAdmin = lazy(() => import('./pages/admin/WhatsAppAdmin'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/:slug" element={<DoctorProfile />} />
          <Route path="specialties" element={<Specialties />} />
          <Route path="specialties/:slug" element={<SpecialtyDetail />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:slug" element={<ServiceDetail />} />
          <Route path="contact" element={<Contact />} />
          <Route path="book" element={<BookAppointment />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin/login" element={<Login />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="doctors" element={<DoctorsAdmin />} />
          <Route path="doctors/:id" element={<DoctorEditor />} />
          <Route path="specialties" element={<SpecialtiesAdmin />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="patients" element={<PatientsAdmin />} />
          <Route path="content" element={<WebsiteContent />} />
          <Route path="homepage" element={<HomepageEditor />} />
          <Route path="testimonials" element={<TestimonialsAdmin />} />
          <Route path="gallery" element={<GalleryAdmin />} />
          <Route path="seo" element={<SeoAdmin />} />
          <Route path="whatsapp" element={<WhatsAppAdmin />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
