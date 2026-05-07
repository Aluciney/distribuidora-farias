import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/http';
import { toast } from '@/store/toast.store';
import { apenasDigitos } from '@/lib/format';

export interface PerfilCliente {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  email: string;
  telefone: string;
}

const KEY = ['cliente-perfil'] as const;

export function useClientePerfil() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<PerfilCliente>('/cliente/perfil'),
    staleTime: 60_000,
  });
}

export function useAtualizarTelefoneCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (telefone: string) =>
      api.patch<{ id: string; telefone: string }>('/cliente/perfil/telefone', {
        telefone: apenasDigitos(telefone),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.sucesso(
        'Telefone atualizado',
        'Seus dados de contato foram salvos.',
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao atualizar', err.message);
    },
  });
}
