import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ícone exibido à esquerda dentro do input. */
  iconeEsquerda?: ReactNode;
  /** Ícone/elemento exibido à direita (ex: botão clear). */
  iconeDireita?: ReactNode;
  invalido?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, iconeEsquerda, iconeDireita, invalido, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {iconeEsquerda && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          {iconeEsquerda}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          invalido
            ? 'border-rose-700 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          iconeEsquerda && 'pl-10',
          iconeDireita && 'pr-10',
          className,
        )}
        {...rest}
      />
      {iconeDireita && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
          {iconeDireita}
        </span>
      )}
    </div>
  );
});
