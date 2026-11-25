import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
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
              <App />
            </AuthProvider>
          </MotionConfig>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
