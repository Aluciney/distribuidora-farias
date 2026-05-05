import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  rodape?: ReactNode;
  /** Largura máxima do diálogo. */
  tamanho?: 'sm' | 'md' | 'lg' | 'xl';
}

const TAMANHO_CLASSES: Record<NonNullable<ModalProps['tamanho']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  tamanho = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-2 py-4 backdrop-blur-sm sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl',
          'animate-[fade-in_0.15s_ease-out]',
          TAMANHO_CLASSES[tamanho],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="modal-titulo"
              className="text-base font-semibold text-slate-100"
            >
              {titulo}
            </h2>
            {descricao && (
              <p className="mt-0.5 text-xs text-slate-400">{descricao}</p>
            )}
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {rodape && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-800 bg-slate-900/60 px-5 py-3 sm:flex-row sm:justify-end">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
