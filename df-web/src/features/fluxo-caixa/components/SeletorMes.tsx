import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '@/utils/format';

interface SeletorMesProps {
  /** Mês corrente no formato `YYYY-MM`. */
  valor: string;
  onChange: (mes: string) => void;
}

function shiftMes(mes: string, delta: number): string {
  const [anoStr, mesStr] = mes.split('-');
  const date = new Date(Number(anoStr), Number(mesStr) - 1 + delta, 1);
  const ano = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${ano}-${m}`;
}

export function SeletorMes({ valor, onChange }: SeletorMesProps) {
  const isoCompleto = `${valor}-01T00:00:00`;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
      <button
        type="button"
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        onClick={() => onChange(shiftMes(valor, -1))}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="min-w-[10rem] px-2 text-center text-sm font-medium text-slate-200">
        {formatMonthYear(isoCompleto)}
      </div>
      <input
        type="month"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-label="Selecionar mês"
      />
      <button
        type="button"
        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        onClick={() => onChange(shiftMes(valor, 1))}
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
