import { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Clock,
  Search,
  Users,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AgingDistribuicao } from '@/features/inadimplencia/components/AgingDistribuicao';
import { ListagemInadimplentes } from '@/features/inadimplencia/components/ListagemInadimplentes';
import {
  useClientesEmAtraso,
  useResumoInadimplencia,
} from '@/features/inadimplencia/hooks/useInadimplencia';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/cn';

type Aba = 'TODOS' | 'EM_ATRASO' | 'A_VENCER';

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: 'EM_ATRASO', rotulo: 'Em atraso' },
  { valor: 'A_VENCER', rotulo: 'A vencer (7d)' },
];

export function InadimplenciaPage() {
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<Aba>('TODOS');
  const [clienteExpandidoId, setClienteExpandidoId] = useState<string | null>(
    null,
  );

  const {
    data: resumo,
    isLoading: resumoLoading,
    isError: resumoError,
    refetch: refetchResumo,
  } = useResumoInadimplencia();
  const {
    data: clientes,
    isLoading: clientesLoading,
    isError: clientesError,
    refetch: refetchClientes,
  } = useClientesEmAtraso();

  const filtrados = useMemo(() => {
    if (!clientes) return [];
    const buscaNorm = busca.trim().toLowerCase();
    const buscaDigitos = busca.replace(/\D/g, '');
    return clientes.filter((item) => {
      if (aba === 'EM_ATRASO' && item.valorVencido === 0) return false;
      if (aba === 'A_VENCER' && item.valorAVencer7Dias === 0) return false;
      if (!buscaNorm) return true;
      return (
        item.cliente.razaoSocial.toLowerCase().includes(buscaNorm) ||
        (buscaDigitos && item.cliente.cnpj.includes(buscaDigitos))
      );
    });
  }, [clientes, aba, busca]);

  const isError = resumoError || clientesError;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-100">
          Dashboard de Inadimplência
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Acompanhe boletos vencidos e cobranças com vencimento nos próximos 7
          dias.
        </p>
      </header>

      {isError && (
        <Card className="border-rose-900/60 bg-rose-950/40">
          <CardBody className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Não foi possível carregar os dados de inadimplência.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchResumo();
                refetchClientes();
              }}
            >
              Tentar novamente
            </Button>
          </CardBody>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCardInadimplencia
          titulo="Total em atraso"
          valor={resumo ? formatCurrency(resumo.totalEmAtraso) : '—'}
          legenda={
            resumo
              ? `${resumo.qtdClientesInadimplentes} cliente${
                  resumo.qtdClientesInadimplentes === 1 ? '' : 's'
                } inadimplente${resumo.qtdClientesInadimplentes === 1 ? '' : 's'}`
              : undefined
          }
          icone={<AlertTriangle className="h-5 w-5" />}
          tom="rose"
          carregando={resumoLoading}
        />
        <KpiCardInadimplencia
          titulo="A vencer (próx. 7 dias)"
          valor={resumo ? formatCurrency(resumo.totalAVencer7Dias) : '—'}
          legenda={
            resumo
              ? `${resumo.qtdFaturasAVencer7Dias} fatura${
                  resumo.qtdFaturasAVencer7Dias === 1 ? '' : 's'
                } pendente${resumo.qtdFaturasAVencer7Dias === 1 ? '' : 's'}`
              : undefined
          }
          icone={<CalendarClock className="h-5 w-5" />}
          tom="sky"
          carregando={resumoLoading}
        />
        <KpiCardInadimplencia
          titulo="Ticket médio em atraso"
          valor={resumo ? formatCurrency(resumo.ticketMedioAtraso) : '—'}
          legenda="Por fatura vencida"
          icone={<Users className="h-5 w-5" />}
          tom="amber"
          carregando={resumoLoading}
        />
        <KpiCardInadimplencia
          titulo="Maior atraso"
          valor={
            resumo
              ? resumo.maiorAtrasoDias > 0
                ? `${resumo.maiorAtrasoDias} dias`
                : '0 dias'
              : '—'
          }
          legenda="Carteira atual"
          icone={<Clock className="h-5 w-5" />}
          tom="violet"
          carregando={resumoLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Distribuição por aging</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Visão consolidada por faixas de atraso e a vencer.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {resumoLoading || !resumo ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-7 animate-pulse rounded bg-slate-800/40"
                  />
                ))}
              </div>
            ) : (
              <AgingDistribuicao faixas={resumo.faixas} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm text-slate-300">
            <p>
              Use a{' '}
              <strong className="text-slate-100">Régua de Cobrança</strong>{' '}
              para automatizar lembretes em cada faixa de aging e diminuir o
              tempo de recuperação.
            </p>
            <p>
              Faturas com mais de 30 dias de atraso devem ser revisadas antes
              de bloquear o cliente em{' '}
              <strong className="text-slate-100">Gestão de Clientes</strong>.
            </p>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Clientes em atraso e a vencer</CardTitle>
            <p className="mt-0.5 text-xs text-slate-500">
              Clique em um cliente para expandir as faturas associadas.
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input
              placeholder="Buscar por razão social ou CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              iconeEsquerda={<Search className="h-4 w-4" />}
              className="lg:w-96"
            />
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
              {ABAS.map((opcao) => {
                const ativo = aba === opcao.valor;
                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => setAba(opcao.valor)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      ativo
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                    )}
                  >
                    {opcao.rotulo}
                  </button>
                );
              })}
            </div>
          </div>

          {clientesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 py-12 text-center">
              <Users className="h-8 w-8 text-slate-600" />
              <p className="text-sm font-medium text-slate-200">
                Nenhum cliente encontrado
              </p>
              <p className="text-xs text-slate-500">
                Ajuste os filtros ou aguarde novas movimentações.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ListagemInadimplentes
                clientes={filtrados}
                clienteExpandidoId={clienteExpandidoId}
                onToggleExpandir={(id) =>
                  setClienteExpandidoId((atual) => (atual === id ? null : id))
                }
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

interface KpiCardInadimplenciaProps {
  titulo: string;
  valor: string;
  legenda?: string;
  icone: React.ReactNode;
  tom: 'rose' | 'sky' | 'amber' | 'violet';
  carregando?: boolean;
}

const TOM_KPI: Record<KpiCardInadimplenciaProps['tom'], string> = {
  rose: 'bg-rose-500/10 text-rose-300',
  sky: 'bg-sky-500/10 text-sky-300',
  amber: 'bg-amber-500/10 text-amber-300',
  violet: 'bg-violet-500/10 text-violet-300',
};

function KpiCardInadimplencia({
  titulo,
  valor,
  legenda,
  icone,
  tom,
  carregando,
}: KpiCardInadimplenciaProps) {
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
            <p className="mt-1 text-2xl font-semibold text-slate-100">{valor}</p>
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
