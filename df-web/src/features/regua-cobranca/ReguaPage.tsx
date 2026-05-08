import { useState } from 'react';
import { AlertCircle, Plus, Workflow } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReguaTimeline } from '@/features/regua-cobranca/components/ReguaTimeline';
import { RegraCard } from '@/features/regua-cobranca/components/RegraCard';
import { RegraFormModal } from '@/features/regua-cobranca/components/RegraFormModal';
import {
  useAlternarRegraAtiva,
  useExcluirRegra,
  useRegras,
} from '@/features/regua-cobranca/hooks/useRegua';
import { GatilhoRegua, type RegraCobranca } from '@/types';

export function ReguaPage() {
  const { data: regras, isLoading, isError, refetch } = useRegras();
  const alternarAtivo = useAlternarRegraAtiva();
  const excluir = useExcluirRegra();

  const [modalAberto, setModalAberto] = useState(false);
  const [regraEditando, setRegraEditando] = useState<RegraCobranca | undefined>();
  const [regraDestaqueId, setRegraDestaqueId] = useState<string | null>(null);
  const [regraParaExcluir, setRegraParaExcluir] = useState<RegraCobranca | null>(
    null,
  );

  const abrirCadastro = () => {
    setRegraEditando(undefined);
    setModalAberto(true);
  };

  const abrirEdicao = (regra: RegraCobranca) => {
    setRegraEditando(regra);
    setModalAberto(true);
  };

  const totalAtivas = regras?.filter((r) => r.ativo).length ?? 0;
  const total = regras?.length ?? 0;

  const grupos = agruparPorGatilho(regras ?? []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Régua de Cobrança
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Automatize lembretes e cobranças por email e WhatsApp antes,
            durante e após o vencimento.
          </p>
        </div>
        <Button onClick={abrirCadastro}>
          <Plus className="h-4 w-4" />
          Nova regra
        </Button>
      </header>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Linha do tempo</CardTitle>
            <p className="mt-0.5 text-xs text-slate-500">
              Cada ponto representa uma regra ativa posicionada relativamente ao
              vencimento.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-slate-800/40" />
          ) : (
            <ReguaTimeline
              regras={regras ?? []}
              regraSelecionadaId={regraDestaqueId}
              onSelecionar={(r) =>
                setRegraDestaqueId((atual) => (atual === r.id ? null : r.id))
              }
            />
          )}
        </CardBody>
      </Card>

      {isError && (
        <Card className="border-rose-900/60 bg-rose-950/40">
          <CardBody className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-rose-200">
              <AlertCircle className="h-4 w-4" />
              Não foi possível carregar as regras.
            </span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-slate-800/40"
            />
          ))}
        </div>
      ) : total === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Workflow className="h-10 w-10 text-slate-600" />
            <div>
              <p className="text-sm font-medium text-slate-200">
                Nenhuma regra cadastrada
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Crie regras para automatizar a comunicação com seus clientes em
                cada faixa de aging.
              </p>
            </div>
            <Button onClick={abrirCadastro} size="sm">
              <Plus className="h-4 w-4" />
              Criar primeira regra
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="text-xs text-slate-500">
            <strong className="text-slate-300">{total}</strong> regra
            {total === 1 ? '' : 's'} —{' '}
            <strong className="text-emerald-300">{totalAtivas}</strong> ativa
            {totalAtivas === 1 ? '' : 's'}.
          </div>

          {grupos.map(({ gatilho, regras: regrasDoGrupo, titulo, descricao }) =>
            regrasDoGrupo.length === 0 ? null : (
              <section key={gatilho} className="space-y-3">
                <header>
                  <h3 className="text-sm font-semibold text-slate-200">
                    {titulo}
                  </h3>
                  <p className="text-xs text-slate-500">{descricao}</p>
                </header>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {regrasDoGrupo.map((regra) => (
                    <RegraCard
                      key={regra.id}
                      regra={regra}
                      destaque={regraDestaqueId === regra.id}
                      onEditar={() => abrirEdicao(regra)}
                      onAlternarAtivo={() => alternarAtivo.mutate(regra.id)}
                      onExcluir={() => setRegraParaExcluir(regra)}
                      carregandoToggle={
                        alternarAtivo.isPending &&
                        alternarAtivo.variables === regra.id
                      }
                    />
                  ))}
                </div>
              </section>
            ),
          )}
        </>
      )}

      <RegraFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        regra={regraEditando}
      />

      <ConfirmDialog
        aberto={Boolean(regraParaExcluir)}
        titulo="Excluir regra"
        mensagem={
          regraParaExcluir
            ? `Tem certeza que deseja excluir "${regraParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar="Excluir"
        carregando={excluir.isPending}
        onConfirmar={async () => {
          if (!regraParaExcluir) return;
          await excluir.mutateAsync(regraParaExcluir.id);
          setRegraParaExcluir(null);
        }}
        onCancelar={() => setRegraParaExcluir(null)}
      />
    </div>
  );
}

interface GrupoGatilho {
  gatilho: GatilhoRegua;
  titulo: string;
  descricao: string;
  regras: RegraCobranca[];
}

function agruparPorGatilho(regras: RegraCobranca[]): GrupoGatilho[] {
  const grupos: GrupoGatilho[] = [
    {
      gatilho: GatilhoRegua.ANTES_VENCIMENTO,
      titulo: 'Antes do vencimento',
      descricao: 'Lembretes preventivos para antecipar o pagamento.',
      regras: [],
    },
    {
      gatilho: GatilhoRegua.DIA_VENCIMENTO,
      titulo: 'No dia do vencimento',
      descricao: 'Aviso final para reduzir esquecimentos.',
      regras: [],
    },
    {
      gatilho: GatilhoRegua.APOS_VENCIMENTO,
      titulo: 'Após o vencimento',
      descricao: 'Cobranças escalonadas conforme dias de atraso.',
      regras: [],
    },
  ];
  for (const r of regras) {
    const grupo = grupos.find((g) => g.gatilho === r.gatilho);
    if (grupo) grupo.regras.push(r);
  }
  // Dentro de cada grupo, ordena pelo offset (mais cedo primeiro).
  for (const g of grupos) {
    g.regras.sort((a, b) => a.diasOffset - b.diasOffset);
  }
  return grupos;
}
