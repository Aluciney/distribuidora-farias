import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { UsuarioFormModal } from '@/features/usuarios/components/UsuarioFormModal';
import {
  useAlternarUsuarioAtivo,
  useUsuarios,
} from '@/features/usuarios/hooks/useUsuarios';
import { PerfilUsuario, type Usuario } from '@/types';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/cn';

type FiltroPerfil = PerfilUsuario | 'TODOS';
type FiltroAtivo = 'TODOS' | 'ATIVOS' | 'INATIVOS';

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.ADMIN]: 'Administrador',
  [PerfilUsuario.FINANCEIRO]: 'Financeiro',
  [PerfilUsuario.CLIENTE]: 'Cliente',
};

const PERFIL_TOM: Record<PerfilUsuario, 'violet' | 'sky' | 'slate'> = {
  [PerfilUsuario.ADMIN]: 'violet',
  [PerfilUsuario.FINANCEIRO]: 'sky',
  [PerfilUsuario.CLIENTE]: 'slate',
};

export function UsuariosPage() {
  const [busca, setBusca] = useState('');
  const [perfilFiltro, setPerfilFiltro] = useState<FiltroPerfil>('TODOS');
  const [ativoFiltro, setAtivoFiltro] = useState<FiltroAtivo>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | undefined>();

  useEffect(() => {
    setPagina(1);
  }, [busca, perfilFiltro, ativoFiltro, porPagina]);

  const filtros = useMemo(
    () => ({
      busca,
      perfil: perfilFiltro,
      ativo:
        ativoFiltro === 'TODOS'
          ? ('TODOS' as const)
          : ativoFiltro === 'ATIVOS',
      pagina,
      porPagina,
    }),
    [busca, perfilFiltro, ativoFiltro, pagina, porPagina],
  );

  const { data, isLoading, isError, refetch } = useUsuarios(filtros);
  const alternar = useAlternarUsuarioAtivo();
  const usuarios = data?.itens;
  const total = data?.total ?? 0;

  const abrirCadastro = () => {
    setUsuarioEditando(undefined);
    setModalAberto(true);
  };
  const abrirEdicao = (u: Usuario) => {
    setUsuarioEditando(u);
    setModalAberto(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Controle de Usuários
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Gerencie os acessos da equipe ao sistema de pagamentos.
          </p>
        </div>
        <Button onClick={abrirCadastro}>
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </header>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              iconeEsquerda={<Search className="h-4 w-4" />}
              className="lg:w-96"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={perfilFiltro}
                onChange={(e) => setPerfilFiltro(e.target.value as FiltroPerfil)}
                className="w-auto"
              >
                <option value="TODOS">Todos os perfis</option>
                <option value={PerfilUsuario.ADMIN}>Administrador</option>
                <option value={PerfilUsuario.FINANCEIRO}>Financeiro</option>
                <option value={PerfilUsuario.CLIENTE}>Cliente</option>
              </Select>
              <Select
                value={ativoFiltro}
                onChange={(e) => setAtivoFiltro(e.target.value as FiltroAtivo)}
                className="w-auto"
              >
                <option value="TODOS">Todos os status</option>
                <option value="ATIVOS">Ativos</option>
                <option value="INATIVOS">Inativos</option>
              </Select>
            </div>
          </div>

          {isError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-sm text-rose-200">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Não foi possível carregar os usuários.
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : !usuarios || usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800 bg-slate-950/40 py-16 text-center">
              <Users className="h-10 w-10 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Nenhum usuário encontrado
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ajuste os filtros ou cadastre um novo usuário.
                </p>
              </div>
              <Button onClick={abrirCadastro} size="sm">
                <Plus className="h-4 w-4" />
                Novo usuário
              </Button>
            </div>
          ) : (
            <UsuariosListagem
              usuarios={usuarios}
              onEditar={abrirEdicao}
              onAlternar={(u) => alternar.mutate(u.id)}
              alternandoId={alternar.isPending ? alternar.variables : undefined}
            />
          )}
        </CardBody>
        <Pagination
          pagina={pagina}
          porPagina={porPagina}
          total={total}
          onPaginaChange={setPagina}
          onPorPaginaChange={setPorPagina}
        />
      </Card>

      <UsuarioFormModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        usuario={usuarioEditando}
      />
    </div>
  );
}

interface UsuariosListagemProps {
  usuarios: Usuario[];
  onEditar: (u: Usuario) => void;
  onAlternar: (u: Usuario) => void;
  alternandoId?: string;
}

function UsuariosListagem({
  usuarios,
  onEditar,
  onAlternar,
  alternandoId,
}: UsuariosListagemProps) {
  return (
    <>
      {/* Tabela md+ */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Último acesso</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {usuarios.map((u) => (
              <tr
                key={u.id}
                className={cn(
                  'text-slate-200 transition-colors hover:bg-slate-800/40',
                  !u.ativo && 'opacity-70',
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                      {iniciais(u.nome)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100">{u.nome}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tom={PERFIL_TOM[u.perfil]}>
                    {u.perfil === PerfilUsuario.ADMIN && (
                      <ShieldCheck className="mr-1 inline-block h-3 w-3" />
                    )}
                    {PERFIL_LABEL[u.perfil]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {u.ultimoAcesso ? formatDateTime(u.ultimoAcesso) : '—'}
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={u.ativo}
                    disabled={alternandoId === u.id}
                    onChange={() => onAlternar(u)}
                    aria-label={u.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    onClick={() => onEditar(u)}
                    aria-label={`Editar ${u.nome}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <ul className="space-y-2 md:hidden">
        {usuarios.map((u) => (
          <li
            key={u.id}
            className={cn(
              'rounded-lg border border-slate-800 bg-slate-900/40 p-4',
              !u.ativo && 'opacity-70',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
                  {iniciais(u.nome)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-100">{u.nome}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <Badge tom={PERFIL_TOM[u.perfil]}>{PERFIL_LABEL[u.perfil]}</Badge>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Último acesso:{' '}
              <span className="text-slate-300">
                {u.ultimoAcesso ? formatDateTime(u.ultimoAcesso) : '—'}
              </span>
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Switch
                checked={u.ativo}
                disabled={alternandoId === u.id}
                onChange={() => onAlternar(u)}
                label={u.ativo ? 'Ativo' : 'Inativo'}
              />
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                onClick={() => onEditar(u)}
              >
                <Pencil className="h-3 w-3" /> Editar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
