import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tom = 'emerald' | 'sky' | 'rose' | 'amber' | 'slate' | 'violet';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tom?: Tom;
  children: ReactNode;
}

const TOM_CLASSES: Record<Tom, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-300',
  rose: 'bg-rose-500/10 text-rose-300',
  amber: 'bg-amber-500/10 text-amber-300',
  slate: 'bg-slate-700/50 text-slate-300',
  violet: 'bg-violet-500/10 text-violet-300',
};

export function Badge({
  tom = 'slate',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TOM_CLASSES[tom],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
