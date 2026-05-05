import { useMemo } from 'react';
import type { MovimentacaoDia } from '@/features/fluxo-caixa/mocks/fluxoCaixa.mock';
import { formatCurrency } from '@/utils/format';

interface GraficoMovimentacoesProps {
  dados: MovimentacaoDia[];
}

/**
 * Gráfico de barras inline em SVG comparando recebido vs previsto por dia.
 * Sem libs externas: cabe e responde ao container.
 */
export function GraficoMovimentacoes({ dados }: GraficoMovimentacoesProps) {
  const { maxValor, totalRecebido, totalPrevisto } = useMemo(() => {
    const max = Math.max(
      ...dados.flatMap((d) => [d.recebido, d.previsto]),
      1,
    );
    const recebido = dados.reduce((acc, d) => acc + d.recebido, 0);
    const previsto = dados.reduce((acc, d) => acc + d.previsto, 0);
    return { maxValor: max, totalRecebido: recebido, totalPrevisto: previsto };
  }, [dados]);

  const larguraTotal = 100;
  const larguraGrupo = larguraTotal / dados.length;
  const larguraBarra = larguraGrupo * 0.38;
  const espacamentoBarra = larguraGrupo * 0.08;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-3 rounded-sm bg-emerald-400" />
          Recebido <strong className="text-slate-200">{formatCurrency(totalRecebido)}</strong>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-3 rounded-sm bg-slate-600" />
          Previsto <strong className="text-slate-200">{formatCurrency(totalPrevisto)}</strong>
        </span>
      </div>

      <div className="relative h-56 w-full">
        <svg
          viewBox={`0 0 ${larguraTotal} 100`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Gráfico de movimentações diárias"
          className="h-full w-full"
        >
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={0}
              x2={larguraTotal}
              y1={100 - p * 100}
              y2={100 - p * 100}
              stroke="currentColor"
              className="text-slate-800"
              strokeWidth={0.2}
            />
          ))}

          {dados.map((d, i) => {
            const baseX = i * larguraGrupo + larguraGrupo * 0.08;
            const alturaRecebido = (d.recebido / maxValor) * 100;
            const alturaPrevisto = (d.previsto / maxValor) * 100;
            return (
              <g key={d.data}>
                <rect
                  x={baseX}
                  y={100 - alturaRecebido}
                  width={larguraBarra}
                  height={alturaRecebido}
                  className="fill-emerald-400/90"
                  rx={0.4}
                >
                  <title>{`${d.data} • Recebido: ${formatCurrency(d.recebido)}`}</title>
                </rect>
                <rect
                  x={baseX + larguraBarra + espacamentoBarra}
                  y={100 - alturaPrevisto}
                  width={larguraBarra}
                  height={alturaPrevisto}
                  className="fill-slate-600/80"
                  rx={0.4}
                >
                  <title>{`${d.data} • Previsto: ${formatCurrency(d.previsto)}`}</title>
                </rect>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-6 text-[10px] text-slate-500 sm:grid-cols-10">
        {dados
          .filter((_, i) => i % Math.ceil(dados.length / 10) === 0)
          .map((d) => (
            <span key={d.data} className="text-center">
              {d.data.slice(-2)}
            </span>
          ))}
      </div>
    </div>
  );
}
