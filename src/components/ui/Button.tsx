import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'ghostDanger' | 'danger' | 'white' | 'glass';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white shadow-soft hover:bg-brand-600 hover:shadow-lift active:scale-[0.97] focus-visible:outline-brand-600 dark:hover:bg-brand-500 dark:hover:shadow-glow',
  secondary: 'bg-brand-50 text-brand-800 hover:bg-brand-100 focus-visible:outline-brand-600',
  outline:
    'border border-slate-300 bg-surface text-ink hover:border-brand-600 hover:text-brand-700 focus-visible:outline-brand-600',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink focus-visible:outline-brand-600',
  ghostDanger: 'text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-red-600',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  white: 'bg-white text-[#0d4f49] shadow-soft hover:bg-mint focus-visible:outline-white',
  glass: 'bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20 focus-visible:outline-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

type LinkButtonProps = CommonProps & { to?: string; href?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

/** Button-styled link: internal (`to`) via React Router, or external (`href`). */
export function LinkButton({ variant = 'primary', size = 'md', icon, fullWidth, className, children, to, href, ...rest }: LinkButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} {...rest}>
      {icon}
      {children}
    </a>
  );
}
