import { Building2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MetodoPagamento, StatusFatura, type Fatura } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/cn';

interface FaturasClienteTabelaProps {
  faturas: Fatura[];
  onSelecionar: (fatura: Fatura) => void;
  /** Quando true, exibe a filial (loja) à qual cada fatura pertence. Útil
   * quando a holding tem várias filiais e a tabela mostra todas juntas. */
  exibirFilial?: boolean;
}

const STATUS_TOM = {
  [StatusFatura.PAGO]: 'emerald',
  [StatusFatura.PENDENTE]: 'amber',
  [StatusFatura.VENCIDO]: 'rose',
  [StatusFatura.CANCELADO]: 'slate',
  [StatusFatura.ESTORNADO]: 'violet',
} as const;

const STATUS_LABEL = {
  [StatusFatura.PAGO]: 'Paga',
  [StatusFatura.PENDENTE]: 'Pendente',
  [StatusFatura.VENCIDO]: 'Vencida',
  [StatusFatura.CANCELADO]: 'Cancelada',
  [StatusFatura.ESTORNADO]: 'Estornada',
} as const;

const METODO_LABEL: Record<MetodoPagamento, string> = {
  [MetodoPagamento.BOLETO]: 'Boleto',
  [MetodoPagamento.PIX]: 'PIX',
  [MetodoPagamento.CARTAO_CREDITO]: 'Cartão',
  [MetodoPagamento.DINHEIRO]: 'Dinheiro',
};

export function FaturasClienteTabela({
  faturas,
  onSelecionar,
  exibirFilial = false,
}: FaturasClienteTabelaProps) {
  return (
    <ul className="divide-y divide-slate-800">
      {faturas.map((f) => {
        const acionavel =
          f.status === StatusFatura.PENDENTE || f.status === StatusFatura.VENCIDO;
        const nomeFilial =
          f.cliente?.nomeFantasia ?? f.cliente?.razaoSocial ?? null;
        return (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onSelecionar(f)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/40',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs text-slate-500">{f.numero}</p>
                  <Badge tom={STATUS_TOM[f.status]}>
                    {STATUS_LABEL[f.status]}
                  </Badge>
                  {exibirFilial && nomeFilial && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                      <Building2 className="h-3 w-3" />
                      {nomeFilial}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-100">
                  Vencimento {formatDate(f.dataVencimento)}
                </p>
                {f.pagamento && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Pago via {METODO_LABEL[f.pagamento.metodo]}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-200">
                  {formatCurrency(f.valor)}
                </p>
                {acionavel && (
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-300">
                    Pagar agora
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 flex-none text-slate-500" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
