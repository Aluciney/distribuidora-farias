import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  erro?: string;
  ajuda?: string;
  obrigatorio?: boolean;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  children,
  erro,
  ajuda,
  obrigatorio,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-wider text-slate-400"
      >
        {label}
        {obrigatorio && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {children}
      {erro ? (
        <p className="text-xs text-rose-400">{erro}</p>
      ) : ajuda ? (
        <p className="text-xs text-slate-500">{ajuda}</p>
      ) : null}
    </div>
  );
}
