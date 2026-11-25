import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockKeyhole, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { loginSchema, type LoginFormValues } from '../../utils/validation';
import { getErrorMessage } from '../../utils/errors';
import { Input } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { PageLoader } from '../../components/ui/Spinner';
import { Logo } from '../../components/layout/Logo';

export default function Login() {
  useDocumentTitle('Admin login');
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  if (status === 'loading') return <PageLoader />;
  if (status === 'authenticated') return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-sky-soft-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-[2rem] border border-slate-200/80 bg-surface p-6 shadow-lift sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <LockKeyhole className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-ink">Admin login</h1>
              <p className="text-sm text-slate-500">Clinic staff only</p>
            </div>
          </div>
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            {error && <Alert tone="error">{error}</Alert>}
            <Input label="Email" type="email" autoComplete="username" required error={errors.email?.message} {...register('email')} />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" fullWidth size="lg" loading={isSubmitting} icon={<LogIn className="size-4" aria-hidden />}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
