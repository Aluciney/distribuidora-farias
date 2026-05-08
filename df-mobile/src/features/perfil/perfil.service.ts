import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/http';
import { toast } from '@/store/toast.store';
import { apenasDigitos } from '@/lib/format';
import { useAuthStore } from '@/store/auth.store';
import type { StatusCliente } from '@/types';

export interface PerfilFilial {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  inscricaoEstadual: string | null;
  status: StatusCliente;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  };
  principal: boolean;
}

export interface PerfilCliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  filiais: PerfilFilial[];
}

const KEY = ['cliente-perfil'] as const;

export function useClientePerfil() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<PerfilCliente>('/cliente/perfil'),
    staleTime: 60_000,
  });
}

export interface AtualizarContatoInput {
  nome?: string;
  telefone?: string;
}

export function useAtualizarContatoCliente() {
  const qc = useQueryClient();
  const setUsuarioCliente = useAuthStore((s) => s.setUsuarioCliente);
  const usuarioAtual = useAuthStore((s) => s.usuarioCliente);
  return useMutation({
    mutationFn: (input: AtualizarContatoInput) =>
      api.patch<{ id: string; nome: string; telefone: string }>(
        '/cliente/perfil/contato',
        {
          nome: input.nome,
          telefone: input.telefone ? apenasDigitos(input.telefone) : undefined,
        },
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY });
      // Mantém o store sincronizado para o cabeçalho refletir o novo nome.
      if (usuarioAtual) {
        setUsuarioCliente({
          ...usuarioAtual,
          nome: res.nome,
          telefone: res.telefone,
        });
      }
      toast.sucesso('Dados atualizados', 'Suas informações foram salvas.');
    },
    onError: (err: Error) => {
      toast.erro('Falha ao atualizar', err.message);
    },
  });
}
