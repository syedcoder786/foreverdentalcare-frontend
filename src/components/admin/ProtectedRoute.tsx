import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui/Spinner';

/** Renders children only for authenticated admins; otherwise redirects to the login page. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <PageLoader label="Checking your session..." />;
  }
  if (status === 'anonymous') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
