import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalido?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalido, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-lg border bg-slate-900 py-2 pl-3 pr-9 text-sm text-slate-100',
          'focus:outline-none focus:ring-2',
          invalido
            ? 'border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
});
