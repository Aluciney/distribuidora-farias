import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalido?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalido, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500',
          'focus:outline-none focus:ring-2',
          invalido
            ? 'border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      />
    );
  },
);
