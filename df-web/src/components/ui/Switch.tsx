import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  function Switch({ className, label, disabled, ...rest }, ref) {
    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-center gap-2',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span className="relative inline-block h-5 w-9 flex-none">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            disabled={disabled}
            {...rest}
          />
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-full bg-slate-700 transition-colors',
              'peer-checked:bg-emerald-500',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-950',
            )}
          />
          <span
            aria-hidden
            className={cn(
              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              'peer-checked:translate-x-4',
            )}
          />
        </span>
        {label && (
          <span className="text-sm text-slate-200">{label}</span>
        )}
      </label>
    );
  },
);
