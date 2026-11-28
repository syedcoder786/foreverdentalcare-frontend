import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { PatientAuthProvider } from './context/PatientAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import { Toaster, toast } from './components/ui/Toast';
import { parseApiError } from './utils/errors';
import './index.css';

declare module '@tanstack/react-query' {
  interface Register {
    /** `silentError: true` on a mutation skips the automatic error toast (the caller shows its own message). */
    mutationMeta: { silentError?: boolean };
  }
}

const queryClient = new QueryClient({
  // Every failed save/delete/action raises an error toast, so the message is seen wherever the user has scrolled.
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.meta?.silentError) return;
      const { message, fieldErrors } = parseApiError(error);
      const firstField = Object.values(fieldErrors)[0];
      if (firstField) toast.error(firstField, { title: 'Please check the form' });
      else toast.error(message, { title: "Couldn't complete that" });
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Retry transient failures only; never retry client errors (4xx).
      retry: (failureCount, error) => {
        if (isAxiosError(error) && error.response && error.response.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          {/* reducedMotion="user": all Motion animations respect the OS "reduce motion" setting. */}
          <MotionConfig reducedMotion="user">
            <AuthProvider>
              <PatientAuthProvider>
                <App />
                <Toaster />
              </PatientAuthProvider>
            </AuthProvider>
          </MotionConfig>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
