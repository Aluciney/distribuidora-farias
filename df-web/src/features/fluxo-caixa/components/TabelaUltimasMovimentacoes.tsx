import { Banknote, CreditCard, QrCode } from 'lucide-react';
import type {
  ResumoMetodo,
  UltimaMovimentacao,
} from '@/features/fluxo-caixa/mocks/fluxoCaixa.mock';
import { MetodoPagamento } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { cn } from '@/lib/cn';

interface TabelaProps {
  movimentacoes: UltimaMovimentacao[];
}

const METODO_LABEL: Record<ResumoMetodo['metodo'], string> = {
  [MetodoPagamento.BOLETO]: 'Boleto',
  [MetodoPagamento.PIX]: 'PIX',
  [MetodoPagamento.CARTAO_CREDITO]: 'Cartão',
  [MetodoPagamento.DINHEIRO]: 'Dinheiro',
};

const METODO_ICONE: Record<ResumoMetodo['metodo'], typeof Banknote> = {
  [MetodoPagamento.BOLETO]: Banknote,
  [MetodoPagamento.PIX]: QrCode,
  [MetodoPagamento.CARTAO_CREDITO]: CreditCard,
  [MetodoPagamento.DINHEIRO]: Banknote,
};

const STATUS_BADGE: Record<UltimaMovimentacao['status'], string> = {
  PAGO: 'bg-emerald-500/10 text-emerald-300',
  PENDENTE: 'bg-amber-500/10 text-amber-300',
  VENCIDO: 'bg-rose-500/10 text-rose-300',
};

export function TabelaUltimasMovimentacoes({ movimentacoes }: TabelaProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Método</th>
            <th className="px-4 py-3 font-medium">Data</th>
            <th className="px-4 py-3 text-right font-medium">Valor</th>
            <th className="px-4 py-3 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {movimentacoes.map((mv) => {
            const Icone = METODO_ICONE[mv.metodo];
            return (
              <tr
                key={mv.id}
                className="text-slate-200 transition-colors hover:bg-slate-800/40"
              >
                <td className="px-4 py-3">{mv.cliente}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <Icone className="h-4 w-4 text-slate-400" />
                    {METODO_LABEL[mv.metodo]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDateTime(mv.data)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(mv.valor)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      STATUS_BADGE[mv.status],
                    )}
                  >
                    {mv.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
