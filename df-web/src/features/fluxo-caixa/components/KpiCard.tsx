import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardBody } from '@/components/ui/Card';

interface KpiCardProps {
  titulo: string;
  valor: string;
  icone: LucideIcon;
  /** Cor de destaque (ex: "emerald", "sky", "rose", "amber"). */
  acento: 'emerald' | 'sky' | 'rose' | 'amber';
  variacao?: number;
  legenda?: string;
  carregando?: boolean;
}

const ACENTO_CLASSES: Record<KpiCardProps['acento'], string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-300',
  rose: 'bg-rose-500/10 text-rose-300',
  amber: 'bg-amber-500/10 text-amber-300',
};

export function KpiCard({
  titulo,
  valor,
  icone: Icone,
  acento,
  variacao,
  legenda,
  carregando,
}: KpiCardProps) {
  const variacaoPositiva = (variacao ?? 0) >= 0;

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {titulo}
            </p>
            {carregando ? (
              <div className="mt-2 h-7 w-32 animate-pulse rounded bg-slate-800" />
            ) : (
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {valor}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              ACENTO_CLASSES[acento],
            )}
          >
            <Icone className="h-5 w-5" />
          </div>
        </div>

        {(variacao !== undefined || legenda) && (
          <div className="flex items-center gap-2 text-xs">
            {variacao !== undefined && !carregando && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                  variacaoPositiva
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-rose-500/10 text-rose-300',
                )}
              >
                {variacaoPositiva ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(variacao).toFixed(1)}%
              </span>
            )}
            {legenda && <span className="text-slate-500">{legenda}</span>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
