import { useMemo, useState } from 'react';
import { Plus, Search, Users, AlertCircle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ClienteFormModal } from '@/features/clientes/components/ClienteFormModal';
import { ClientesTabela } from '@/features/clientes/components/ClientesTabela';
import {
  useAlterarStatusCliente,
  useClientes,
} from '@/features/clientes/hooks/useClientes';
import { StatusCliente, type Cliente } from '@/types';
import { cn } from '@/lib/cn';

type FiltroStatus = StatusCliente | 'TODOS';

interface AbaFiltro {
  valor: FiltroStatus;
  rotulo: string;
}

const ABAS: AbaFiltro[] = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: StatusCliente.ATIVO, rotulo: 'Ativos' },
  { valor: StatusCliente.INATIVO, rotulo: 'Inativos' },
  { valor: StatusCliente.BLOQUEADO, rotulo: 'Bloqueados' },
];

export function ClientesPage() {
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('TODOS');
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | undefined>();
  const [clienteParaStatus, setClienteParaStatus] = useState<Cliente | null>(
    null,
  );

  const filtros = useMemo(
    () => ({ busca, status: statusFiltro }),
    [busca, statusFiltro],
  );
  const { data: clientes, isLoading, isError, refetch } = useClientes(filtros);
  const alterarStatus = useAlterarStatusCliente();

  const abrirCadastro = () => {
    setClienteEditando(undefined);
    setModalAberto(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setModalAberto(true);
  };

  const confirmarAlteracaoStatus = async () => {
    if (!clienteParaStatus) return;
    const proximoStatus =
      clienteParaStatus.status === StatusCliente.ATIVO
        ? StatusCliente.INATIVO
        : StatusCliente.ATIVO;
    await alterarStatus.mutateAsync({
      id: clienteParaStatus.id,
      status: proximoStatus,
    });
    setClienteParaStatus(null);
  };

  const totalAtivos =
    clientes?.filter((c) => c.status === StatusCliente.ATIVO).length ?? 0;
  const total = clientes?.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Gestão de Clientes
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Cadastre, edite e gerencie os clientes da distribuidora.
          </p>
        </div>
        <Button onClick={abrirCadastro}>
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </header>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input
              placeholder="Buscar por razão social, fantasia, email ou CNPJ..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              iconeEsquerda={<Search className="h-4 w-4" />}
              className="lg:w-[420px]"
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
                Não foi possível carregar os clientes.
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
          ) : !clientes || clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
              <Users className="h-10 w-10 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Nenhum cliente encontrado
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ajuste os filtros ou cadastre um novo cliente.
                </p>
              </div>
              <Button onClick={abrirCadastro} size="sm">
                <Plus className="h-4 w-4" />
                Cadastrar cliente
              </Button>
            </div>
          ) : (
            <>
              <ClientesTabela
                clientes={clientes}
                onEditar={abrirEdicao}
                onAlterarStatus={setClienteParaStatus}
              />
              <p className="text-xs text-slate-500">
                Exibindo <strong className="text-slate-300">{total}</strong>{' '}
                cliente{total === 1 ? '' : 's'} —{' '}
                <strong className="text-emerald-300">{totalAtivos}</strong>{' '}
                ativo{totalAtivos === 1 ? '' : 's'}.
              </p>
            </>
          )}
        </CardBody>
      </Card>

      <ClienteFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        cliente={clienteEditando}
      />

      <ConfirmDialog
        aberto={Boolean(clienteParaStatus)}
        titulo={
          clienteParaStatus?.status === StatusCliente.ATIVO
            ? 'Inativar cliente'
            : 'Reativar cliente'
        }
        mensagem={
          clienteParaStatus?.status === StatusCliente.ATIVO
            ? `Tem certeza que deseja inativar ${clienteParaStatus.razaoSocial}? O cliente não poderá receber novas cobranças até ser reativado.`
            : `Reativar ${clienteParaStatus?.razaoSocial ?? ''}? O cliente voltará a poder receber novas cobranças.`
        }
        textoConfirmar={
          clienteParaStatus?.status === StatusCliente.ATIVO
            ? 'Inativar'
            : 'Reativar'
        }
        tom={
          clienteParaStatus?.status === StatusCliente.ATIVO
            ? 'danger'
            : 'primary'
        }
        carregando={alterarStatus.isPending}
        onConfirmar={confirmarAlteracaoStatus}
        onCancelar={() => setClienteParaStatus(null)}
      />
    </div>
  );
}
