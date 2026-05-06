import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface PaginationProps {
  pagina: number;
  porPagina: number;
  total: number;
  onPaginaChange: (pagina: number) => void;
  onPorPaginaChange?: (porPagina: number) => void;
  /** Tamanhos disponíveis no select. Default: 10/20/50/100. */
  opcoesPorPagina?: number[];
  /** Aparece quando a lista está vazia (oculta o componente). */
  className?: string;
}

const OPCOES_PADRAO = [10, 20, 50, 100];

export function Pagination({
  pagina,
  porPagina,
  total,
  onPaginaChange,
  onPorPaginaChange,
  opcoesPorPagina = OPCOES_PADRAO,
  className,
}: PaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  if (total === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-xs text-slate-400">
        Exibindo <strong className="text-slate-200">{inicio}</strong>–
        <strong className="text-slate-200">{fim}</strong> de{' '}
        <strong className="text-slate-200">{total}</strong>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onPorPaginaChange && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Por página
            <select
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              value={porPagina}
              onChange={(e) => onPorPaginaChange(Number(e.target.value))}
            >
              {opcoesPorPagina.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPaginaChange(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <span className="px-2 text-xs text-slate-300">
          Pág. <strong className="text-slate-100">{pagina}</strong> de{' '}
          <strong className="text-slate-100">{totalPaginas}</strong>
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPaginaChange(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
