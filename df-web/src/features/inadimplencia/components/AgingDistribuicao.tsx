import {
  FAIXA_LABEL,
  FAIXA_TOM,
  type FaixaResumo,
} from '@/features/inadimplencia/services/inadimplencia.service';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/cn';

interface AgingDistribuicaoProps {
  faixas: FaixaResumo[];
}

const TOM_BARRA: Record<'amber' | 'rose' | 'sky' | 'violet', string> = {
  sky: 'bg-sky-500/80',
  amber: 'bg-amber-500/80',
  rose: 'bg-rose-500/80',
  violet: 'bg-violet-500/80',
};

const TOM_TEXTO: Record<'amber' | 'rose' | 'sky' | 'violet', string> = {
  sky: 'text-sky-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
  violet: 'text-violet-300',
};

export function AgingDistribuicao({ faixas }: AgingDistribuicaoProps) {
  const valorMaximo = Math.max(...faixas.map((f) => f.valor), 1);

  return (
    <ul className="space-y-3">
      {faixas.map((faixa) => {
        const tom = FAIXA_TOM[faixa.faixa];
        const percentual = (faixa.valor / valorMaximo) * 100;
        return (
          <li key={faixa.faixa} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={cn('font-medium', TOM_TEXTO[tom])}>
                {FAIXA_LABEL[faixa.faixa]}
              </span>
              <span className="text-slate-400">
                {faixa.qtdFaturas} fatura
                {faixa.qtdFaturas === 1 ? '' : 's'} •{' '}
                <strong className="text-slate-200">
                  {formatCurrency(faixa.valor)}
                </strong>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  TOM_BARRA[tom],
                )}
                style={{ width: `${Math.max(percentual, faixa.valor > 0 ? 4 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
