import { Mail, MessageCircle, Smartphone } from 'lucide-react';
import { CanalNotificacao, GatilhoRegua, type RegraCobranca } from '@/types';
import { cn } from '@/lib/cn';

interface ReguaTimelineProps {
  regras: RegraCobranca[];
  /** Regra atualmente em destaque (clique). */
  regraSelecionadaId?: string | null;
  onSelecionar: (regra: RegraCobranca) => void;
}

const CANAL_ICONE = {
  [CanalNotificacao.EMAIL]: Mail,
  [CanalNotificacao.WHATSAPP]: MessageCircle,
  [CanalNotificacao.SMS]: Smartphone,
} as const;

/**
 * Visualização horizontal de todas as regras posicionadas em um eixo:
 * extremo esquerdo = mais dias antes; centro = vencimento; extremo direito = mais dias depois.
 */
export function ReguaTimeline({
  regras,
  regraSelecionadaId,
  onSelecionar,
}: ReguaTimelineProps) {
  const ativas = regras.filter((r) => r.ativo);
  if (ativas.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Nenhuma regra ativa. Ative ou crie uma regra para visualizá-la na linha
        do tempo.
      </p>
    );
  }

  const minOffset = Math.min(...ativas.map((r) => r.diasOffset), -7);
  const maxOffset = Math.max(...ativas.map((r) => r.diasOffset), 7);
  const intervalo = maxOffset - minOffset || 1;

  // Posiciona o "vencimento" (offset = 0) no eixo proporcionalmente.
  const posicaoVencimento = ((0 - minOffset) / intervalo) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
        <span>{minOffset} dias</span>
        <span>VENCIMENTO</span>
        <span>+{maxOffset} dias</span>
      </div>

      <div className="relative h-24 rounded-lg border border-slate-800 bg-slate-950/40 p-2">
        {/* Eixo central */}
        <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-slate-800" />

        {/* Marca do vencimento */}
        <div
          className="absolute top-1/2 h-12 w-0.5 -translate-y-1/2 bg-emerald-500/60"
          style={{ left: `calc(${posicaoVencimento}% + 0px)` }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
            Vencimento
          </span>
        </div>

        {/* Pontos de cada regra */}
        {ativas.map((regra) => {
          const pos = ((regra.diasOffset - minOffset) / intervalo) * 100;
          const cor =
            regra.gatilho === GatilhoRegua.ANTES_VENCIMENTO
              ? 'bg-sky-500'
              : regra.gatilho === GatilhoRegua.DIA_VENCIMENTO
                ? 'bg-emerald-500'
                : 'bg-rose-500';
          const selecionada = regraSelecionadaId === regra.id;
          return (
            <button
              type="button"
              key={regra.id}
              onClick={() => onSelecionar(regra)}
              className={cn(
                'absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-transform hover:scale-110',
                selecionada && 'scale-110',
              )}
              style={{ left: `${pos}%` }}
              title={regra.nome}
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900',
                  cor,
                  selecionada && 'ring-2 ring-emerald-300/60',
                )}
              >
                {regra.acoes.length > 0 &&
                  (() => {
                    const Icone = CANAL_ICONE[regra.acoes[0].canal];
                    return <Icone className="h-3 w-3 text-slate-950" />;
                  })()}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Antes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          No dia
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Após
        </span>
      </div>
    </div>
  );
}
