import { useEffect, useState } from 'react';
import { Mail, Phone, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { useAtualizarUsuarioCliente } from '@/features/usuarios-cliente/hooks/useUsuariosCliente';
import { maskTelefone } from '@/utils/cnpj';
import type { UsuarioCliente } from '@/types';

interface EditarUsuarioClienteModalProps {
  aberto: boolean;
  onFechar: () => void;
  usuario: UsuarioCliente | null;
}

interface FormState {
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
}

export function EditarUsuarioClienteModal({
  aberto,
  onFechar,
  usuario,
}: EditarUsuarioClienteModalProps) {
  const [state, setState] = useState<FormState>({
    nome: '',
    email: '',
    telefone: '',
    ativo: true,
  });
  const [erro, setErro] = useState<string | null>(null);
  const atualizar = useAtualizarUsuarioCliente();

  useEffect(() => {
    if (aberto && usuario) {
      setState({
        nome: usuario.nome,
        email: usuario.email,
        telefone: maskTelefone(usuario.telefone),
        ativo: usuario.ativo,
      });
      setErro(null);
    }
  }, [aberto, usuario]);

  if (!usuario) return null;

  async function salvar() {
    if (!usuario) return;
    setErro(null);
    if (state.nome.trim().length < 2) return setErro('Informe o nome.');
    if (!/^\S+@\S+\.\S+$/.test(state.email)) return setErro('Email inválido.');
    const tel = state.telefone.replace(/\D/g, '');
    if (tel.length !== 10 && tel.length !== 11)
      return setErro('Telefone deve ter 10 ou 11 dígitos.');

    const input: {
      nome?: string;
      email?: string;
      telefone?: string;
      ativo?: boolean;
    } = {};
    const nomeNovo = state.nome.trim();
    const emailNovo = state.email.trim().toLowerCase();
    if (nomeNovo !== usuario.nome) input.nome = nomeNovo;
    if (emailNovo !== usuario.email.toLowerCase()) input.email = emailNovo;
    if (tel !== usuario.telefone) input.telefone = tel;
    if (state.ativo !== usuario.ativo) input.ativo = state.ativo;

    if (Object.keys(input).length === 0) {
      onFechar();
      return;
    }

    try {
      await atualizar.mutateAsync({ id: usuario.id, input });
      onFechar();
    } catch {
      // toast já dispara
    }
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo={`Editar ${usuario.nome}`}
      descricao="Atualize os dados de cadastro da holding/usuário cliente."
      tamanho="md"
      rodape={
        <>
          <Button
            variant="outline"
            onClick={onFechar}
            disabled={atualizar.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={salvar} loading={atualizar.isPending}>
            <Save className="h-4 w-4" />
            Salvar alterações
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Nome" htmlFor="edit-uc-nome" obrigatorio>
          <Input
            id="edit-uc-nome"
            value={state.nome}
            onChange={(e) =>
              setState((s) => ({ ...s, nome: e.target.value }))
            }
            placeholder="Ex: Grupo Central"
          />
        </FormField>
        <FormField label="Email" htmlFor="edit-uc-email" obrigatorio>
          <Input
            id="edit-uc-email"
            type="email"
            value={state.email}
            onChange={(e) =>
              setState((s) => ({ ...s, email: e.target.value }))
            }
            iconeEsquerda={<Mail className="h-4 w-4" />}
            placeholder="contato@empresa.com.br"
          />
        </FormField>
        <FormField label="Telefone (com DDD)" htmlFor="edit-uc-telefone" obrigatorio>
          <Input
            id="edit-uc-telefone"
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

        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={state.ativo}
            onChange={(e) =>
              setState((s) => ({ ...s, ativo: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
          />
          Usuário ativo
        </label>

        {erro && (
          <p className="rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
            {erro}
          </p>
        )}
      </div>
    </Modal>
  );
}
