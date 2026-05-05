import { ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  FAIXA_LABEL,
  FAIXA_TOM,
  type ClienteEmAtraso,
} from '@/features/inadimplencia/services/inadimplencia.service';
import { formatCNPJ, formatCurrency, formatDate } from '@/utils/format';

interface ListagemInadimplentesProps {
  clientes: ClienteEmAtraso[];
  /** Quando informado, filtra por id do cliente expandido. */
  clienteExpandidoId?: string | null;
  onToggleExpandir: (id: string) => void;
}

export function ListagemInadimplentes({
  clientes,
  clienteExpandidoId,
  onToggleExpandir,
}: ListagemInadimplentesProps) {
  return (
    <ul className="divide-y divide-slate-800">
      {clientes.map((item) => {
        const expandido = clienteExpandidoId === item.cliente.id;
        const tom = FAIXA_TOM[item.piorFaixa];
        return (
          <li key={item.cliente.id}>
            <button
              type="button"
              onClick={() => onToggleExpandir(item.cliente.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/40"
            >
              <ChevronRight
                className={`h-4 w-4 flex-none text-slate-500 transition-transform ${
                  expandido ? 'rotate-90' : ''
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-100">
                  {item.cliente.razaoSocial}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {formatCNPJ(item.cliente.cnpj)}
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs text-slate-500">Atraso máx.</p>
                <p className="text-sm font-semibold text-slate-200">
                  {item.diasAtrasoMaximo > 0
                    ? `${item.diasAtrasoMaximo} dias`
                    : '—'}
                </p>
              </div>
              <div className="hidden text-right md:block">
                <p className="text-xs text-slate-500">A vencer (7d)</p>
                <p className="text-sm text-sky-300">
                  {formatCurrency(item.valorAVencer7Dias)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Vencido</p>
                <p className="text-sm font-semibold text-rose-300">
                  {formatCurrency(item.valorVencido)}
                </p>
              </div>
              <Badge tom={tom}>{FAIXA_LABEL[item.piorFaixa]}</Badge>
            </button>

            {expandido && (
              <div className="border-t border-slate-800 bg-slate-950/40 px-4 py-3">
                <table className="w-full min-w-130 text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Fatura</th>
                      <th className="py-2 pr-3 font-medium">Vencimento</th>
                      <th className="py-2 pr-3 font-medium">Método</th>
                      <th className="py-2 pr-3 text-right font-medium">
                        Valor
                      </th>
                      <th className="py-2 text-right font-medium">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {item.faturas.map((f) => {
                      const hoje = new Date('2026-05-05T12:00:00Z').getTime();
                      const dias = Math.floor(
                        (hoje - new Date(f.dataVencimento).getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const emAtraso = dias > 0;
                      return (
                        <tr key={f.id}>
                          <td className="py-2 pr-3 font-mono text-xs text-slate-300">
                            {f.numero}
                          </td>
                          <td className="py-2 pr-3 text-slate-300">
                            {formatDate(f.dataVencimento)}
                          </td>
                          <td className="py-2 pr-3 text-slate-300">
                            Boleto + PIX
                          </td>
                          <td className="py-2 pr-3 text-right font-medium text-slate-200">
                            {formatCurrency(f.valor)}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                emAtraso ? 'text-rose-300' : 'text-sky-300'
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              {emAtraso
                                ? `${dias}d em atraso`
                                : `vence em ${Math.abs(dias)}d`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
