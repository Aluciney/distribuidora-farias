import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useToastStore, type TipoToast } from '@/store/toast.store';
import { cn } from '@/lib/cn';

const TIPO_ESTILO: Record<
  TipoToast,
  { borda: string; fundo: string; icone: typeof CheckCircle2; cor: string }
> = {
  sucesso: {
    borda: 'border-emerald-700/60',
    fundo: 'bg-emerald-950/80',
    icone: CheckCircle2,
    cor: 'text-emerald-300',
  },
  erro: {
    borda: 'border-rose-700/60',
    fundo: 'bg-rose-950/80',
    icone: AlertCircle,
    cor: 'text-rose-300',
  },
  aviso: {
    borda: 'border-amber-700/60',
    fundo: 'bg-amber-950/80',
    icone: AlertTriangle,
    cor: 'text-amber-300',
  },
  info: {
    borda: 'border-sky-700/60',
    fundo: 'bg-sky-950/80',
    icone: Info,
    cor: 'text-sky-300',
  },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end">
      {toasts.map((t) => {
        const estilo = TIPO_ESTILO[t.tipo];
        const Icone = estilo.icone;
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur',
              estilo.borda,
              estilo.fundo,
            )}
          >
            <Icone className={cn('h-5 w-5 flex-none', estilo.cor)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-100">{t.titulo}</p>
              {t.descricao && (
                <p className="mt-0.5 text-xs text-slate-400">{t.descricao}</p>
              )}
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              onClick={() => remove(t.id)}
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
