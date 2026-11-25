import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const controlBase =
  'block w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-slate-400 transition ' +
  'focus:outline-none focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500';

function controlClasses(hasError: boolean) {
  return cn(
    controlBase,
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 hover:border-slate-400 focus:border-brand-500 focus:ring-brand-100',
  );
}

interface FieldWrapperProps {
  id: string;
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ id, label, error, hint, required, optional, children, className }: FieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500" aria-hidden>*</span>}
          {optional && <span className="font-normal text-slate-400">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type BaseFieldProps = {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, BaseFieldProps & InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, error, hint, optional, wrapperClassName, className, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint} required={required} optional={optional} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        aria-required={required || undefined}
        className={cn(controlClasses(Boolean(error)), 'h-11', className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

export const Select = forwardRef<HTMLSelectElement, BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { label, error, hint, optional, wrapperClassName, className, id, required, children, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint} required={required} optional={optional} className={wrapperClassName}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        aria-required={required || undefined}
        className={cn(controlClasses(Boolean(error)), 'h-11 pr-9', className)}
        {...rest}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ label, error, hint, optional, wrapperClassName, className, id, required, ...rest }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <FieldWrapper id={fieldId} label={label} error={error} hint={hint} required={required} optional={optional} className={wrapperClassName}>
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(controlClasses(Boolean(error)), 'min-h-24 py-2.5', className)}
          {...rest}
        />
      </FieldWrapper>
    );
  },
);

export const Checkbox = forwardRef<HTMLInputElement, { label: ReactNode; error?: string } & InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ label, error, id, className, ...rest }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className={cn('space-y-1.5', className)}>
        <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className="mt-0.5 size-4.5 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-700"
            {...rest}
          />
          <span>{label}</span>
        </label>
        {error && (
          <p id={`${fieldId}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  },
);
