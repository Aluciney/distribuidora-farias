import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api/http';
import { toast } from '@/store/toast.store';
import { apenasDigitos } from '@/utils/cnpj';

export interface PerfilFilial {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  inscricaoEstadual: string | null;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
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
  return useMutation({
    mutationFn: (input: AtualizarContatoInput) =>
      api.patch<{ id: string; nome: string; telefone: string }>(
        '/cliente/perfil/contato',
        {
          nome: input.nome,
          telefone: input.telefone ? apenasDigitos(input.telefone) : undefined,
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['usuario-cliente-logado'] });
      toast.sucesso('Dados atualizados', 'Suas informações foram salvas.');
    },
    onError: (err: Error) => {
      toast.erro('Falha ao atualizar', err.message);
    },
  });
}
