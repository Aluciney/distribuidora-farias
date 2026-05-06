import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useFaturasCliente } from '@/features/cliente-portal/faturas/hooks/useFaturasCliente';
import { useClienteLogado } from '@/features/cliente-portal/shared/hooks/useClienteLogado';
import { PagamentoModal } from '@/features/cliente-portal/faturas/components/PagamentoModal';
import { StatusFatura, type Fatura } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { cn } from '@/lib/cn';

interface ResumoCliente {
  totalGasto: number;
  totalEmAberto: number;
  totalVencido: number;
  qtdAberto: number;
  proximas: Fatura[];
}

function calcularResumo(faturas: Fatura[]): ResumoCliente {
  let totalGasto = 0;
  let totalEmAberto = 0;
  let totalVencido = 0;
  let qtdAberto = 0;
  for (const f of faturas) {
    if (f.status === StatusFatura.PAGO) {
      totalGasto += f.valorPago ?? f.valor;
    }
    if (f.status === StatusFatura.PENDENTE) {
      totalEmAberto += f.valor;
      qtdAberto += 1;
    }
    if (f.status === StatusFatura.VENCIDO) {
      totalVencido += f.valor;
      qtdAberto += 1;
    }
  }
  const proximas = faturas
    .filter(
      (f) =>
        f.status === StatusFatura.PENDENTE || f.status === StatusFatura.VENCIDO,
    )
    .sort((a, b) =>
      a.dataVencimento < b.dataVencimento
        ? -1
        : a.dataVencimento > b.dataVencimento
          ? 1
          : 0,
    )
    .slice(0, 4);
  return {
    totalGasto,
    totalEmAberto,
    totalVencido,
    qtdAberto,
    proximas,
  };
}

export function DashboardClientePage() {
  const { data: cliente } = useClienteLogado();
  const { data, isLoading, isError } = useFaturasCliente({
    status: 'TODOS',
    porPagina: 100,
  });
  const resumo = useMemo(() => calcularResumo(data?.itens ?? []), [data]);
  const [faturaSelecionada, setFaturaSelecionada] = useState<Fatura | null>(
    null,
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Bem-vindo de volta
        </p>
        <h2 className="text-2xl font-semibold text-slate-100">
          {cliente?.razaoSocial ?? 'Carregando...'}
        </h2>
        <p className="text-sm text-slate-400">
          Aqui você acompanha seus pagamentos e quita suas faturas em segundos.
        </p>
      </header>

      {isError && (
        <Card className="border-rose-900/60 bg-rose-950/40">
          <CardBody className="flex items-center gap-2 text-sm text-rose-200">
            <AlertCircle className="h-4 w-4" />
            Não foi possível carregar suas faturas.
          </CardBody>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCliente
          titulo="Total gasto (histórico)"
          valor={formatCurrency(resumo.totalGasto)}
          legenda="Faturas pagas"
          icone={<Wallet className="h-5 w-5" />}
          tom="emerald"
          carregando={isLoading}
        />
        <KpiCliente
          titulo="Em aberto"
          valor={formatCurrency(resumo.totalEmAberto)}
          legenda="Aguardando pagamento"
          icone={<TrendingUp className="h-5 w-5" />}
          tom="sky"
          carregando={isLoading}
        />
        <KpiCliente
          titulo="Vencidas"
          valor={formatCurrency(resumo.totalVencido)}
          legenda="Regularize quanto antes"
          icone={<AlertCircle className="h-5 w-5" />}
          tom="rose"
          carregando={isLoading}
        />
        <KpiCliente
          titulo="Faturas em aberto"
          valor={String(resumo.qtdAberto)}
          legenda="Pendentes + vencidas"
          icone={<CalendarClock className="h-5 w-5" />}
          tom="amber"
          carregando={isLoading}
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Próximos vencimentos</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Clique em uma fatura para pagar agora.
              </p>
            </div>
            <Link
              to="/cliente/faturas"
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-300 hover:text-sky-200"
            >
              Ver todas
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : resumo.proximas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <p className="text-sm font-medium text-slate-200">
                Nenhuma fatura em aberto
              </p>
              <p className="text-xs text-slate-500">
                Você está em dia com a Distribuidora Farias.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {resumo.proximas.map((f) => {
                const tom =
                  f.status === StatusFatura.VENCIDO ? 'rose' : 'amber';
                const label =
                  f.status === StatusFatura.VENCIDO ? 'Vencida' : 'Pendente';
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setFaturaSelecionada(f)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-xs text-slate-500">
                            {f.numero}
                          </p>
                          <Badge tom={tom}>{label}</Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-200">
                          Vence em {formatDate(f.dataVencimento)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">
                        {formatCurrency(f.valor)}
                      </p>
                      <ArrowRight className="h-4 w-4 text-slate-500" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <PagamentoModal
        aberto={Boolean(faturaSelecionada)}
        onFechar={() => setFaturaSelecionada(null)}
        fatura={faturaSelecionada}
      />
    </div>
  );
}

interface KpiClienteProps {
  titulo: string;
  valor: string;
  legenda?: string;
  icone: React.ReactNode;
  tom: 'emerald' | 'sky' | 'amber' | 'rose';
  carregando?: boolean;
}

const TOM_KPI: Record<KpiClienteProps['tom'], string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-300',
  amber: 'bg-amber-500/10 text-amber-300',
  rose: 'bg-rose-500/10 text-rose-300',
};

function KpiCliente({
  titulo,
  valor,
  legenda,
  icone,
  tom,
  carregando,
}: KpiClienteProps) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3">
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
          {legenda && !carregando && (
            <p className="mt-1 text-xs text-slate-500">{legenda}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            TOM_KPI[tom],
          )}
        >
          {icone}
        </div>
      </CardBody>
    </Card>
  );
}
