import { Banknote, CheckCheck, Eye, Ban, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MetodoPagamento, StatusFatura, type Fatura } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/cn';

interface FaturasTabelaProps {
  faturas: Fatura[];
  onAbrirDetalhes: (fatura: Fatura) => void;
  onBaixarManual: (fatura: Fatura) => void;
  onCancelarFatura: (fatura: Fatura) => void;
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

function podeBaixar(f: Fatura): boolean {
  return (
    f.status === StatusFatura.PENDENTE || f.status === StatusFatura.VENCIDO
  );
}

export function FaturasTabela({
  faturas,
  onAbrirDetalhes,
  onBaixarManual,
  onCancelarFatura,
}: FaturasTabelaProps) {
  return (
    <>
      {/* Tabela md+ */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-205 text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Número</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Formas</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {faturas.map((fatura) => (
              <tr
                key={fatura.id}
                className="cursor-pointer text-slate-200 transition-colors hover:bg-slate-800/40"
                onClick={() => onAbrirDetalhes(fatura)}
              >
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-slate-300">
                    {fatura.numero}
                  </p>
                  <p className="text-xs text-slate-500">
                    Pedido {fatura.pedidoId}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-100">
                    {fatura.cliente?.razaoSocial}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-amber-300">
                      <Banknote className="h-3 w-3" /> Boleto
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-300">
                      <QrCode className="h-3 w-3" /> PIX
                    </span>
                    {fatura.pagamento && (
                      <span className="mt-0.5 text-slate-500">
                        Pago via{' '}
                        <strong className="text-slate-300">
                          {METODO_LABEL[fatura.pagamento.metodo]}
                        </strong>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDate(fatura.dataVencimento)}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(fatura.valor)}
                </td>
                <td className="px-4 py-3">
                  <Badge tom={STATUS_TOM[fatura.status]}>
                    {STATUS_LABEL[fatura.status]}
                  </Badge>
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      onClick={() => onAbrirDetalhes(fatura)}
                      aria-label="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {podeBaixar(fatura) && (
                      <>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-emerald-300 hover:bg-emerald-500/10"
                          onClick={() => onBaixarManual(fatura)}
                          aria-label="Dar baixa manual"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-rose-300 hover:bg-rose-500/10"
                          onClick={() => onCancelarFatura(fatura)}
                          aria-label="Cancelar fatura"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <ul className="space-y-2 md:hidden">
        {faturas.map((fatura) => (
          <li
            key={fatura.id}
            onClick={() => onAbrirDetalhes(fatura)}
            className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-slate-500">
                  {fatura.numero}
                </p>
                <p className="font-medium text-slate-100">
                  {fatura.cliente?.razaoSocial}
                </p>
              </div>
              <Badge tom={STATUS_TOM[fatura.status]}>
                {STATUS_LABEL[fatura.status]}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-slate-500">Vencimento</dt>
                <dd className="text-slate-300">
                  {formatDate(fatura.dataVencimento)}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-slate-500">Valor</dt>
                <dd className="font-medium text-slate-200">
                  {formatCurrency(fatura.valor)}
                </dd>
              </div>
            </dl>
            <div
              className="mt-3 flex items-center justify-between gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <Banknote className="h-3 w-3 text-amber-300" />
                <QrCode className="h-3 w-3 text-emerald-300" />
                Boleto + PIX
              </span>
              <div className="flex items-center gap-1">
                {podeBaixar(fatura) && (
                  <>
                    <button
                      type="button"
                      className={cn(
                        'rounded-md border border-emerald-700/60 px-2 py-1 text-xs text-emerald-300',
                      )}
                      onClick={() => onBaixarManual(fatura)}
                    >
                      Baixar
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-700/60 px-2 py-1 text-xs text-rose-300"
                      onClick={() => onCancelarFatura(fatura)}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
