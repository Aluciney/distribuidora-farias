import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, Star, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useCriarUsuarioCliente } from '@/features/usuarios-cliente/hooks/useUsuariosCliente';
import { maskCNPJ, maskTelefone } from '@/utils/cnpj';
import { cn } from '@/lib/cn';
import type { Cliente } from '@/types';

interface NovoUsuarioClienteModalProps {
  aberto: boolean;
  onFechar: () => void;
}

interface FormState {
  nome: string;
  email: string;
  telefone: string;
  filiaisIds: Set<string>;
  filialPrincipalId: string | null;
}

const STATE_INICIAL: FormState = {
  nome: '',
  email: '',
  telefone: '',
  filiaisIds: new Set(),
  filialPrincipalId: null,
};

export function NovoUsuarioClienteModal({
  aberto,
  onFechar,
}: NovoUsuarioClienteModalProps) {
  const [state, setState] = useState<FormState>(STATE_INICIAL);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const criar = useCriarUsuarioCliente();

  // Lista todas as filiais possíveis para vincular. 100 cobre o caso da DF
  // tranquilamente; quando a base crescer, evoluímos para combobox paginado.
  const { data: lista, isLoading: carregandoFiliais } = useClientes({
    busca,
    porPagina: 100,
  });
  const filiaisDisponiveis = lista?.itens ?? [];
  const filiaisSelecionadas = useMemo(
    () => filiaisDisponiveis.filter((c) => state.filiaisIds.has(c.id)),
    [filiaisDisponiveis, state.filiaisIds],
  );

  useEffect(() => {
    if (aberto) {
      setState(STATE_INICIAL);
      setErro(null);
      setBusca('');
    }
  }, [aberto]);

  function toggleFilial(c: Cliente) {
    setState((s) => {
      const ids = new Set(s.filiaisIds);
      if (ids.has(c.id)) {
        ids.delete(c.id);
        return {
          ...s,
          filiaisIds: ids,
          filialPrincipalId:
            s.filialPrincipalId === c.id ? null : s.filialPrincipalId,
        };
      }
      ids.add(c.id);
      return {
        ...s,
        filiaisIds: ids,
        filialPrincipalId: s.filialPrincipalId ?? c.id,
      };
    });
  }

  async function salvar() {
    setErro(null);
    if (state.nome.trim().length < 2) return setErro('Informe o nome.');
    if (!/^\S+@\S+\.\S+$/.test(state.email)) return setErro('Email inválido.');
    const tel = state.telefone.replace(/\D/g, '');
    if (tel.length !== 10 && tel.length !== 11)
      return setErro('Telefone deve ter 10 ou 11 dígitos.');
    if (state.filiaisIds.size === 0)
      return setErro('Selecione ao menos uma filial.');
    if (!state.filialPrincipalId)
      return setErro('Marque uma das filiais como sede (principal).');

    try {
      await criar.mutateAsync({
        nome: state.nome.trim(),
        email: state.email.trim().toLowerCase(),
        telefone: tel,
        filialPrincipalId: state.filialPrincipalId,
        filiaisIds: Array.from(state.filiaisIds).filter(
          (id) => id !== state.filialPrincipalId,
        ),
      });
      onFechar();
    } catch {
      // toast já dispara
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Novo usuário cliente"
      descricao="Cadastre uma holding/cliente e vincule as filiais. Um email de convite será enviado para definir a senha inicial."
      tamanho="lg"
      rodape={
        <>
          <Button variant="outline" onClick={onFechar} disabled={criar.isPending}>
            Cancelar
          </Button>
          <Button onClick={salvar} loading={criar.isPending}>
            <UserPlus className="h-4 w-4" />
            Criar e enviar convite
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nome" htmlFor="uc-nome" obrigatorio>
            <Input
              id="uc-nome"
              value={state.nome}
              onChange={(e) =>
                setState((s) => ({ ...s, nome: e.target.value }))
              }
              placeholder="Ex: Grupo Central"
            />
          </FormField>
          <FormField label="Email" htmlFor="uc-email" obrigatorio>
            <Input
              id="uc-email"
              type="email"
              value={state.email}
              onChange={(e) =>
                setState((s) => ({ ...s, email: e.target.value }))
              }
              iconeEsquerda={<Mail className="h-4 w-4" />}
              placeholder="contato@empresa.com.br"
            />
          </FormField>
          <FormField
            label="Telefone (com DDD)"
            htmlFor="uc-telefone"
            obrigatorio
            className="sm:col-span-2"
          >
            <Input
              id="uc-telefone"
              value={state.telefone}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  telefone: maskTelefone(e.target.value),
                }))
              }
              iconeEsquerda={<Phone className="h-4 w-4" />}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </FormField>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Filiais vinculadas
              <span className="ml-2 rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                {state.filiaisIds.size}
              </span>
            </h3>
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar filial..."
              className="max-w-[220px]"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800">
            {carregandoFiliais ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-md bg-slate-800/40"
                  />
                ))}
              </div>
            ) : filiaisDisponiveis.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Nenhuma filial encontrada.
              </div>
            ) : (
              <ul className="divide-y divide-slate-800">
                {filiaisDisponiveis.map((c) => {
                  const selecionada = state.filiaisIds.has(c.id);
                  const principal = state.filialPrincipalId === c.id;
                  return (
                    <li
                      key={c.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 transition-colors',
                        selecionada && 'bg-emerald-500/5',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selecionada}
                        onChange={() => toggleFilial(c)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {c.nomeFantasia ?? c.razaoSocial}
                        </p>
                        <p className="truncate font-mono text-xs text-slate-500">
                          {maskCNPJ(c.cnpj)} · {c.endereco.cidade}/{c.endereco.uf}
                        </p>
                      </div>
                      {selecionada && (
                        <button
                          type="button"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              filialPrincipalId: c.id,
                            }))
                          }
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs',
                            principal
                              ? 'border-amber-700/60 bg-amber-500/10 text-amber-300'
                              : 'border-slate-700 text-slate-400 hover:bg-slate-800',
                          )}
                        >
                          <Star className="h-3 w-3" />
                          {principal ? 'Sede' : 'Definir sede'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {filiaisSelecionadas.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Sede:{' '}
              <span className="font-medium text-slate-300">
                {filiaisSelecionadas.find((f) => f.id === state.filialPrincipalId)
                  ?.nomeFantasia ??
                  filiaisSelecionadas.find((f) => f.id === state.filialPrincipalId)
                    ?.razaoSocial ??
                  '— marque uma —'}
              </span>
            </p>
          )}
        </div>

        {erro && (
          <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
            {erro}
          </p>
        )}
      </div>
    </Modal>
  );
}
