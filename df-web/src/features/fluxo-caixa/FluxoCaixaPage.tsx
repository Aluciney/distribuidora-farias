import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Download,
  QrCode,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { KpiCard } from '@/features/fluxo-caixa/components/KpiCard';
import { GraficoMovimentacoes } from '@/features/fluxo-caixa/components/GraficoMovimentacoes';
import { SeletorMes } from '@/features/fluxo-caixa/components/SeletorMes';
import { TabelaUltimasMovimentacoes } from '@/features/fluxo-caixa/components/TabelaUltimasMovimentacoes';
import { useFluxoCaixa } from '@/features/fluxo-caixa/hooks/useFluxoCaixa';
import { exportarFluxoCaixaCsv } from '@/features/fluxo-caixa/utils/exportarFluxoCaixa';
import { formatCurrency } from '@/utils/format';
import { MetodoPagamento } from '@/types';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toast.store';

const METODO_LABEL: Record<string, string> = {
  [MetodoPagamento.BOLETO]: 'Boleto',
  [MetodoPagamento.PIX]: 'PIX',
  [MetodoPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
};

const METODO_ICONE: Record<string, typeof Banknote> = {
  [MetodoPagamento.BOLETO]: Banknote,
  [MetodoPagamento.PIX]: QrCode,
  [MetodoPagamento.CARTAO_CREDITO]: CreditCard,
};

const METODO_COR: Record<string, string> = {
  [MetodoPagamento.BOLETO]: 'bg-amber-500/10 text-amber-300',
  [MetodoPagamento.PIX]: 'bg-emerald-500/10 text-emerald-300',
  [MetodoPagamento.CARTAO_CREDITO]: 'bg-sky-500/10 text-sky-300',
};

function getMesAtualISO(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

export function FluxoCaixaPage() {
  const [mesSelecionado, setMesSelecionado] = useState<string>(getMesAtualISO());
  const { data, isLoading, isError, refetch } = useFluxoCaixa(mesSelecionado);

  const totalGeralPendente = useMemo(
    () => (data ? data.totalPendente + data.totalVencido : 0),
    [data],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Fluxo de Caixa
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Visão consolidada de entradas e previsões financeiras do mês.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorMes valor={mesSelecionado} onChange={setMesSelecionado} />
          <button
            type="button"
            disabled={!data || isLoading}
            onClick={() => {
              if (!data) return;
              try {
                exportarFluxoCaixaCsv(data, mesSelecionado);
                toast.sucesso('Exportação concluída', 'O arquivo CSV foi baixado.');
              } catch (err) {
                toast.erro(
                  'Falha ao exportar',
                  err instanceof Error ? err.message : 'Tente novamente.',
                );
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </header>

      {isError && (
        <Card className="border-rose-900/60 bg-rose-950/40">
          <CardBody className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-rose-200">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">
                Não foi possível carregar os dados do fluxo de caixa.
              </span>
            </div>
            <button
              type="button"
              className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm font-medium text-rose-200 hover:bg-rose-500/30"
              onClick={() => refetch()}
            >
              Tentar novamente
            </button>
          </CardBody>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Recebido no mês"
          icone={Wallet}
          acento="emerald"
          valor={data ? formatCurrency(data.totalRecebido) : '—'}
          variacao={data?.variacaoMesAnterior}
          legenda="vs. mês anterior"
          carregando={isLoading}
        />
        <KpiCard
          titulo="A receber (pendente)"
          icone={TrendingUp}
          acento="sky"
          valor={data ? formatCurrency(data.totalPendente) : '—'}
          legenda={data ? `${data.totalFaturas} faturas no mês` : undefined}
          carregando={isLoading}
        />
        <KpiCard
          titulo="Vencidos"
          icone={AlertCircle}
          acento="rose"
          valor={data ? formatCurrency(data.totalVencido) : '—'}
          legenda="Cobrança ativa"
          carregando={isLoading}
        />
        <KpiCard
          titulo="Ticket médio"
          icone={CreditCard}
          acento="amber"
          valor={data ? formatCurrency(data.ticketMedio) : '—'}
          legenda={
            data
              ? `Total em aberto ${formatCurrency(totalGeralPendente)}`
              : undefined
          }
          carregando={isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Movimentações diárias</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Entradas confirmadas vs. previsão para o mês selecionado.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {isLoading || !data ? (
              <div className="h-56 animate-pulse rounded-lg bg-slate-800/40" />
            ) : (
              <GraficoMovimentacoes dados={data.movimentacoesDiarias} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por método de pagamento</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {isLoading || !data
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-lg bg-slate-800/40"
                  />
                ))
              : data.resumoPorMetodo.map((item) => {
                  const Icone = METODO_ICONE[item.metodo] ?? Banknote;
                  return (
                    <div
                      key={item.metodo}
                      className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3"
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          METODO_COR[item.metodo],
                        )}
                      >
                        <Icone className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200">
                          {METODO_LABEL[item.metodo] ?? item.metodo}
                        </p>
                        <p className="text-xs text-slate-500">
                          Pendente {formatCurrency(item.pendente)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-300">
                        {formatCurrency(item.recebido)}
                      </p>
                    </div>
                  );
                })}
          </CardBody>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Últimas movimentações</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Transações mais recentes consolidadas no fluxo do mês.
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              Ver todas
            </button>
          </CardHeader>
          <CardBody className="p-0">
            {isLoading || !data ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-slate-800/40"
                  />
                ))}
              </div>
            ) : (
              <TabelaUltimasMovimentacoes
                movimentacoes={data.ultimasMovimentacoes}
              />
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
