import { Home } from 'lucide-react';
import { LinkButton } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-semibold text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-ink">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">The page may have moved, or the link may be incorrect.</p>
      <LinkButton to="/" className="mt-8" icon={<Home className="size-4" aria-hidden />}>
        Back to home
      </LinkButton>
    </section>
  );
}
