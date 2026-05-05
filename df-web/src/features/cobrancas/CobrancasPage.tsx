import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Receipt,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFaturas } from '@/features/cobrancas/hooks/useCobrancas';
import { FaturasTabela } from '@/features/cobrancas/components/FaturasTabela';
import { NovaCobrancaModal } from '@/features/cobrancas/components/NovaCobrancaModal';
import { DetalhesFaturaModal } from '@/features/cobrancas/components/DetalhesFaturaModal';
import { BaixaManualModal } from '@/features/cobrancas/components/BaixaManualModal';
import { CancelarFaturaModal } from '@/features/cobrancas/components/CancelarFaturaModal';
import {
  StatusFatura,
  type Fatura,
  type ValorEmCentavos,
} from '@/types';
import type { StatusFiltro } from '@/features/cobrancas/services/cobrancas.mock';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/cn';

interface AbaStatus {
  valor: StatusFiltro;
  rotulo: string;
}

const ABAS: AbaStatus[] = [
  { valor: 'TODOS', rotulo: 'Todas' },
  { valor: StatusFatura.PENDENTE, rotulo: 'Pendentes' },
  { valor: StatusFatura.VENCIDO, rotulo: 'Vencidas' },
  { valor: StatusFatura.PAGO, rotulo: 'Pagas' },
  { valor: StatusFatura.CANCELADO, rotulo: 'Canceladas' },
];

interface ResumoKpis {
  pendente: ValorEmCentavos;
  vencido: ValorEmCentavos;
  pagoMes: ValorEmCentavos;
  totalCobrancas: number;
}

function calcularKpis(faturas: Fatura[]): ResumoKpis {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  return faturas.reduce<ResumoKpis>(
    (acc, f) => {
      acc.totalCobrancas += 1;
      if (f.status === StatusFatura.PENDENTE) acc.pendente += f.valor;
      if (f.status === StatusFatura.VENCIDO) acc.vencido += f.valor;
      if (
        f.status === StatusFatura.PAGO &&
        f.dataPagamento &&
        new Date(f.dataPagamento).getTime() >= inicioMes.getTime()
      ) {
        acc.pagoMes += f.valorPago ?? f.valor;
      }
      return acc;
    },
    { pendente: 0, vencido: 0, pagoMes: 0, totalCobrancas: 0 },
  );
}

export function CobrancasPage() {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('TODOS');

  const [novaCobrancaAberta, setNovaCobrancaAberta] = useState(false);
  const [detalhesFatura, setDetalhesFatura] = useState<Fatura | null>(null);
  const [baixaFatura, setBaixaFatura] = useState<Fatura | null>(null);
  const [cancelarFatura, setCancelarFatura] = useState<Fatura | null>(null);

  const filtros = useMemo(
    () => ({ busca, status: statusFiltro }),
    [busca, statusFiltro],
  );
  const { data: faturas, isLoading, isError, refetch } = useFaturas(filtros);
  const { data: faturasGlobal } = useFaturas({ busca: '' });

  const kpis = useMemo(
    () => calcularKpis(faturasGlobal ?? []),
    [faturasGlobal],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Gestão de Cobranças
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Toda cobrança gera Boleto Febraban e PIX simultaneamente. Registre
            baixas manuais e cancele conforme padrão Febraban.
          </p>
        </div>
        <Button onClick={() => setNovaCobrancaAberta(true)}>
          <Plus className="h-4 w-4" />
          Nova cobrança
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiResumoCard
          titulo="Pendentes"
          valor={formatCurrency(kpis.pendente)}
          legenda="Aguardando pagamento"
          icone={<TrendingUp className="h-5 w-5" />}
          tom="amber"
        />
        <KpiResumoCard
          titulo="Vencidas"
          valor={formatCurrency(kpis.vencido)}
          legenda="Inadimplência ativa"
          icone={<AlertCircle className="h-5 w-5" />}
          tom="rose"
        />
        <KpiResumoCard
          titulo="Recebido no mês"
          valor={formatCurrency(kpis.pagoMes)}
          legenda="Baixas registradas"
          icone={<CheckCircle2 className="h-5 w-5" />}
          tom="emerald"
        />
        <KpiResumoCard
          titulo="Cobranças totais"
          valor={String(kpis.totalCobrancas)}
          legenda="Histórico completo"
          icone={<Receipt className="h-5 w-5" />}
          tom="sky"
        />
      </section>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input
              placeholder="Buscar por número, cliente ou CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              iconeEsquerda={<Search className="h-4 w-4" />}
              className="lg:w-100"
            />

            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
              {ABAS.map((aba) => {
                const ativo = statusFiltro === aba.valor;
                return (
                  <button
                    key={aba.valor}
                    type="button"
                    onClick={() => setStatusFiltro(aba.valor)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      ativo
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                    )}
                  >
                    {aba.rotulo}
                  </button>
                );
              })}
            </div>
          </div>

          {isError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-sm text-rose-200">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Não foi possível carregar as cobranças.
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : !faturas || faturas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
              <Receipt className="h-10 w-10 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Nenhuma cobrança encontrada
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ajuste os filtros ou cadastre uma nova cobrança.
                </p>
              </div>
              <Button onClick={() => setNovaCobrancaAberta(true)} size="sm">
                <Plus className="h-4 w-4" />
                Nova cobrança
              </Button>
            </div>
          ) : (
            <>
              <FaturasTabela
                faturas={faturas}
                onAbrirDetalhes={setDetalhesFatura}
                onBaixarManual={setBaixaFatura}
                onCancelarFatura={setCancelarFatura}
              />
              <p className="text-xs text-slate-500">
                Exibindo{' '}
                <strong className="text-slate-300">{faturas.length}</strong>{' '}
                cobrança{faturas.length === 1 ? '' : 's'}.
              </p>
            </>
          )}
        </CardBody>
      </Card>

      <NovaCobrancaModal
        aberto={novaCobrancaAberta}
        onFechar={() => setNovaCobrancaAberta(false)}
      />

      <DetalhesFaturaModal
        aberto={Boolean(detalhesFatura)}
        onFechar={() => setDetalhesFatura(null)}
        fatura={detalhesFatura}
        onBaixarManual={() => {
          if (detalhesFatura) {
            setBaixaFatura(detalhesFatura);
            setDetalhesFatura(null);
          }
        }}
        onCancelarFatura={() => {
          if (detalhesFatura) {
            setCancelarFatura(detalhesFatura);
            setDetalhesFatura(null);
          }
        }}
      />

      <BaixaManualModal
        aberto={Boolean(baixaFatura)}
        onFechar={() => setBaixaFatura(null)}
        fatura={baixaFatura}
      />

      <CancelarFaturaModal
        aberto={Boolean(cancelarFatura)}
        onFechar={() => setCancelarFatura(null)}
        fatura={cancelarFatura}
      />
    </div>
  );
}

interface KpiResumoCardProps {
  titulo: string;
  valor: string;
  legenda?: string;
  icone: React.ReactNode;
  tom: 'emerald' | 'amber' | 'rose' | 'sky';
}

const TOM_KPI: Record<KpiResumoCardProps['tom'], string> = {
  emerald: 'bg-emerald-500/10 text-emerald-300',
  amber: 'bg-amber-500/10 text-amber-300',
  rose: 'bg-rose-500/10 text-rose-300',
  sky: 'bg-sky-500/10 text-sky-300',
};

function KpiResumoCard({
  titulo,
  valor,
  legenda,
  icone,
  tom,
}: KpiResumoCardProps) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {titulo}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{valor}</p>
          {legenda && (
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
