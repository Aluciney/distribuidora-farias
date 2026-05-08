import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Mail,
  MailWarning,
  Phone,
  Plus,
  Search,
  ShieldOff,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import {
  useAtualizarUsuarioCliente,
  useReenviarConvite,
  useUsuariosCliente,
} from '@/features/usuarios-cliente/hooks/useUsuariosCliente';
import { NovoUsuarioClienteModal } from '@/features/usuarios-cliente/components/NovoUsuarioClienteModal';
import { GerenciarFiliaisModal } from '@/features/usuarios-cliente/components/GerenciarFiliaisModal';
import { maskTelefone } from '@/utils/cnpj';
import type { UsuarioCliente } from '@/types';

type FiltroAtivo = 'TODOS' | 'ATIVOS' | 'INATIVOS';

export function UsuariosClientePage() {
  const [busca, setBusca] = useState('');
  const [ativoFiltro, setAtivoFiltro] = useState<FiltroAtivo>('TODOS');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(20);
  const [criarAberto, setCriarAberto] = useState(false);
  const [usuarioFiliais, setUsuarioFiliais] = useState<UsuarioCliente | null>(
    null,
  );

  useEffect(() => setPagina(1), [busca, ativoFiltro, porPagina]);

  const { data, isLoading, isError, refetch } = useUsuariosCliente({
    busca,
    ativo:
      ativoFiltro === 'TODOS'
        ? 'TODOS'
        : ativoFiltro === 'ATIVOS'
          ? true
          : false,
    pagina,
    porPagina,
  });
  const itens = data?.itens ?? [];
  const total = data?.total ?? 0;

  const atualizar = useAtualizarUsuarioCliente();
  const reenviar = useReenviarConvite();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">
            Usuários cliente
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Holdings que acessam o portal do cliente. Cada usuário pode controlar
            uma ou várias filiais (lojas).
          </p>
        </div>
        <Button onClick={() => setCriarAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo usuário cliente
        </Button>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-300" />
              <CardTitle>Holdings cadastradas</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, email..."
                iconeEsquerda={<Search className="h-4 w-4" />}
                className="w-[260px]"
              />
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
        </CardHeader>
        <CardBody className="p-0">
          {isError && (
            <div className="flex items-center justify-between gap-3 p-4 text-sm text-rose-200">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Não foi possível carregar a lista.
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-slate-800/40"
                />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-slate-500">
              <Users className="h-8 w-8 text-slate-600" />
              Nenhum usuário cliente cadastrado.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800">
              {itens.map((u) => (
                <li key={u.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-100">
                          {u.nome}
                        </p>
                        <Badge tom={u.ativo ? 'emerald' : 'slate'}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {u.senhaDefinida === false && (
                          <Badge tom="amber">
                            <MailWarning className="mr-1 h-3 w-3" />
                            Convite pendente
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {maskTelefone(u.telefone)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {u.filiais.length === 0 ? (
                          <span className="text-xs text-rose-300">
                            Sem filiais vinculadas
                          </span>
                        ) : (
                          u.filiais.map((f) => (
                            <span
                              key={f.id}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900/40 px-1.5 py-0.5 text-[11px] text-slate-300"
                            >
                              <Building2 className="h-3 w-3" />
                              {f.nomeFantasia ?? f.razaoSocial}
                              {f.principal && (
                                <Star className="h-3 w-3 text-amber-300" />
                              )}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {u.senhaDefinida === false && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={
                            reenviar.isPending && reenviar.variables === u.id
                          }
                          onClick={() => reenviar.mutate(u.id)}
                        >
                          <Mail className="h-3 w-3" />
                          Reenviar convite
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUsuarioFiliais(u)}
                      >
                        <Building2 className="h-3 w-3" />
                        Filiais
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          atualizar.mutate({
                            id: u.id,
                            input: { ativo: !u.ativo },
                          })
                        }
                      >
                        {u.ativo ? (
                          <>
                            <ShieldOff className="h-3 w-3" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            Reativar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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

      <NovoUsuarioClienteModal
        aberto={criarAberto}
        onFechar={() => setCriarAberto(false)}
      />
      <GerenciarFiliaisModal
        aberto={Boolean(usuarioFiliais)}
        onFechar={() => setUsuarioFiliais(null)}
        usuario={usuarioFiliais}
      />
    </div>
  );
}
