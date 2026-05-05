import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, FileText } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FaturasClienteTabela } from '@/features/cliente-portal/faturas/components/FaturasClienteTabela';
import { PagamentoModal } from '@/features/cliente-portal/faturas/components/PagamentoModal';
import { useFaturasCliente } from '@/features/cliente-portal/faturas/hooks/useFaturasCliente';
import { StatusFatura, type Fatura } from '@/types';
import { cn } from '@/lib/cn';

type Aba = 'ABERTOS' | 'PAGOS' | 'VENCIDOS';

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: 'ABERTOS', rotulo: 'Abertos' },
  { valor: 'PAGOS', rotulo: 'Pagos' },
  { valor: 'VENCIDOS', rotulo: 'Vencidos' },
];

function statusFiltradoParaAba(aba: Aba): StatusFatura | 'TODOS' {
  if (aba === 'ABERTOS') return StatusFatura.PENDENTE;
  if (aba === 'PAGOS') return StatusFatura.PAGO;
  return StatusFatura.VENCIDO;
}

export function FaturasClientePage() {
  const navigate = useNavigate();
  const { id: faturaIdRota } = useParams<{ id?: string }>();
  const [aba, setAba] = useState<Aba>('ABERTOS');
  const [faturaSelecionada, setFaturaSelecionada] = useState<Fatura | null>(
    null,
  );

  const filtro = useMemo(
    () => ({ status: statusFiltradoParaAba(aba) }),
    [aba],
  );
  const { data: faturas, isLoading, isError, refetch } = useFaturasCliente(filtro);

  // Quando há um id na URL (ex: /cliente/faturas/fat-001), abre o modal correspondente.
  const { data: todasFaturas } = useFaturasCliente({ status: 'TODOS' });
  useEffect(() => {
    if (!faturaIdRota || !todasFaturas) return;
    const f = todasFaturas.find((x) => x.id === faturaIdRota);
    if (f) setFaturaSelecionada(f);
  }, [faturaIdRota, todasFaturas]);

  const fecharModal = () => {
    setFaturaSelecionada(null);
    if (faturaIdRota) navigate('/cliente/faturas');
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-slate-100">
          Minhas Faturas
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Acompanhe e pague suas faturas com Boleto, PIX ou cartão de crédito.
        </p>
      </header>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1">
            {ABAS.map((opcao) => {
              const ativo = aba === opcao.valor;
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() => setAba(opcao.valor)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    ativo
                      ? 'bg-sky-500/10 text-sky-300'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                  )}
                >
                  {opcao.rotulo}
                </button>
              );
            })}
          </div>

          {isError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-sm text-rose-200">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Não foi possível carregar suas faturas.
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : !faturas || faturas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
              <FileText className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-medium text-slate-200">
                {aba === 'ABERTOS' && 'Nenhuma fatura em aberto'}
                {aba === 'PAGOS' && 'Nenhuma fatura paga ainda'}
                {aba === 'VENCIDOS' && 'Sem faturas vencidas — parabéns!'}
              </p>
            </div>
          ) : (
            <FaturasClienteTabela
              faturas={faturas}
              onSelecionar={setFaturaSelecionada}
            />
          )}
        </CardBody>
      </Card>

      <PagamentoModal
        aberto={Boolean(faturaSelecionada)}
        onFechar={fecharModal}
        fatura={faturaSelecionada}
      />
    </div>
  );
}
