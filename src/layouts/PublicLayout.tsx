import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { WhatsAppFloatingButton } from '../components/layout/WhatsAppButton';
import { ScrollToTop } from '../components/layout/ScrollToTop';
import { AnimatedOutlet } from '../components/motion/AnimatedOutlet';
import { ScrollProgress } from '../components/motion/ScrollProgress';

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-brand-700 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <ScrollToTop />
      <Navbar />
      <main id="main" className="flex-1">
        <AnimatedOutlet />
      </main>
      <Footer />
      <WhatsAppFloatingButton />
    </div>
  );
}
