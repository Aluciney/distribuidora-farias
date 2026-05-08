import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Layers,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDashboardCliente } from '@/features/cliente-portal/dashboard/hooks/useDashboardCliente';
import { useUsuarioClienteLogado } from '@/features/cliente-portal/shared/hooks/useClienteLogado';
import { PagamentoModal } from '@/features/cliente-portal/faturas/components/PagamentoModal';
import { cobrancasService } from '@/features/cobrancas/services/cobrancas.mock';
import { StatusFatura, type Fatura } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/cn';

export function DashboardClientePage() {
  const { data: usuario } = useUsuarioClienteLogado();
  const filialSelecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  const filiais = useAuthStore((s) => s.filiais);
  const filialAtiva = filialSelecionadaId
    ? filiais.find((f) => f.id === filialSelecionadaId)
    : null;
  const { data, isLoading, isError } = useDashboardCliente();
  const [faturaSelecionada, setFaturaSelecionada] = useState<Fatura | null>(
    null,
  );

  const totalGasto = data?.totalGasto ?? 0;
  const totalEmAberto = data?.totalEmAberto ?? 0;
  const totalVencido = data?.totalVencido ?? 0;
  const qtdAberto = data?.qtdFaturasEmAberto ?? 0;
  const proximas = data?.proximas ?? [];

  async function abrirFatura(faturaId: string) {
    // O resumo do dashboard traz só id+numero+valor+vencimento+status+filial.
    // Para o modal de pagamento precisamos do detalhe completo (boleto+pix).
    const fatura = await cobrancasService.obter(faturaId);
    if (fatura) setFaturaSelecionada(fatura);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Bem-vindo de volta
        </p>
        <h2 className="text-2xl font-semibold text-slate-100">
          {usuario?.nome ?? 'Carregando...'}
        </h2>
        <p className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          {filialAtiva ? (
            <>
              <Building2 className="h-4 w-4 text-sky-400" />
              Visualizando dados de
              <span className="font-medium text-slate-200">
                {filialAtiva.nomeFantasia ?? filialAtiva.razaoSocial}
              </span>
            </>
          ) : (
            <>
              <Layers className="h-4 w-4 text-emerald-400" />
              Visão consolidada de
              <span className="font-medium text-slate-200">
                {filiais.length} filial(is)
              </span>
            </>
          )}
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
          valor={formatCurrency(totalGasto)}
          legenda="Faturas pagas"
          icone={<Wallet className="h-5 w-5" />}
          tom="emerald"
          carregando={isLoading}
        />
        <KpiCliente
          titulo="Em aberto"
          valor={formatCurrency(totalEmAberto)}
          legenda="Aguardando pagamento"
          icone={<TrendingUp className="h-5 w-5" />}
          tom="sky"
          carregando={isLoading}
        />
        <KpiCliente
          titulo="Vencidas"
          valor={formatCurrency(totalVencido)}
          legenda="Regularize quanto antes"
          icone={<AlertCircle className="h-5 w-5" />}
          tom="rose"
          carregando={isLoading}
        />
        <KpiCliente
          titulo="Faturas em aberto"
          valor={String(qtdAberto)}
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
          ) : proximas.length === 0 ? (
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
              {proximas.map((f) => {
                const tom =
                  f.status === StatusFatura.VENCIDO ? 'rose' : 'amber';
                const label =
                  f.status === StatusFatura.VENCIDO ? 'Vencida' : 'Pendente';
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => abrirFatura(f.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-xs text-slate-500">
                            {f.numero}
                          </p>
                          <Badge tom={tom}>{label}</Badge>
                          {!filialAtiva && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                              <Building2 className="h-3 w-3" />
                              {f.filial.nomeFantasia ?? f.filial.razaoSocial}
                            </span>
                          )}
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
