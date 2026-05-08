import { useMemo, useState } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import {
  useDefinirFilialPrincipal,
  useDesvincularFilial,
  useVincularFilial,
} from '@/features/usuarios-cliente/hooks/useUsuariosCliente';
import { maskCNPJ } from '@/utils/cnpj';
import type { UsuarioCliente } from '@/types';

interface GerenciarFiliaisModalProps {
  aberto: boolean;
  onFechar: () => void;
  usuario: UsuarioCliente | null;
}

export function GerenciarFiliaisModal({
  aberto,
  onFechar,
  usuario,
}: GerenciarFiliaisModalProps) {
  const [filialEscolhida, setFilialEscolhida] = useState('');
  const [confirmarRemover, setConfirmarRemover] = useState<string | null>(null);
  const vincular = useVincularFilial();
  const desvincular = useDesvincularFilial();
  const definirPrincipal = useDefinirFilialPrincipal();

  const { data: lista } = useClientes({ porPagina: 100 });
  const todasFiliais = lista?.itens ?? [];

  const idsJaVinculados = useMemo(
    () => new Set(usuario?.filiais.map((f) => f.id) ?? []),
    [usuario],
  );
  const disponiveis = todasFiliais.filter((c) => !idsJaVinculados.has(c.id));

  if (!usuario) return null;

  async function adicionar() {
    if (!filialEscolhida || !usuario) return;
    await vincular.mutateAsync({
      id: usuario.id,
      clienteId: filialEscolhida,
      principal: false,
    });
    setFilialEscolhida('');
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={`Filiais de ${usuario.nome}`}
      descricao="Gerencie quais lojas esta holding administra. A sede é apenas informativa — todas as filiais têm o mesmo nível de acesso."
      tamanho="lg"
      rodape={
        <Button onClick={onFechar} variant="outline">
          Fechar
        </Button>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-200">
            Vincular nova filial
          </h3>
          <div className="flex gap-2">
            <Select
              value={filialEscolhida}
              onChange={(e) => setFilialEscolhida(e.target.value)}
              className="flex-1"
            >
              <option value="">— Selecione uma filial —</option>
              {disponiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nomeFantasia ?? c.razaoSocial} ({maskCNPJ(c.cnpj)})
                </option>
              ))}
            </Select>
            <Button
              onClick={adicionar}
              disabled={!filialEscolhida || vincular.isPending}
              loading={vincular.isPending}
            >
              <Plus className="h-4 w-4" />
              Vincular
            </Button>
          </div>
          {disponiveis.length === 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Todas as filiais cadastradas já estão vinculadas a este usuário.
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-200">
            Filiais vinculadas
            <span className="ml-2 rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
              {usuario.filiais.length}
            </span>
          </h3>
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
            {usuario.filiais.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {f.nomeFantasia ?? f.razaoSocial}
                    {f.principal && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                        <Star className="h-3 w-3" />
                        Sede
                      </span>
                    )}
                  </p>
                  <p className="truncate font-mono text-xs text-slate-500">
                    {maskCNPJ(f.cnpj)} · {f.status.toLowerCase()}
                  </p>
                </div>
                {!f.principal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      definirPrincipal.mutate({
                        id: usuario.id,
                        clienteId: f.id,
                      })
                    }
                  >
                    <Star className="h-3 w-3" />
                    Marcar sede
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmarRemover(f.id)}
                  disabled={usuario.filiais.length === 1}
                  title={
                    usuario.filiais.length === 1
                      ? 'Não é possível desvincular a única filial — desative o usuário ou vincule outra antes.'
                      : undefined
                  }
                >
                  <Trash2 className="h-3 w-3" />
                  Desvincular
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <ConfirmDialog
        aberto={Boolean(confirmarRemover)}
        titulo="Desvincular filial?"
        mensagem="A holding deixará de ter acesso às faturas e notificações desta loja. Esta ação pode ser revertida vinculando novamente."
        textoConfirmar="Desvincular"
        tom="danger"
        carregando={desvincular.isPending}
        onConfirmar={async () => {
          if (!confirmarRemover) return;
          await desvincular.mutateAsync({
            id: usuario.id,
            clienteId: confirmarRemover,
          });
          setConfirmarRemover(null);
        }}
        onCancelar={() => setConfirmarRemover(null)}
      />
    </Modal>
  );
}
