import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth.mock';
import { useAuthStore } from '@/store/auth.store';
import type { Cliente } from '@/types';

/**
 * Resolve o `Cliente` da sessão consultando `/auth/eu` — único endpoint
 * acessível pelo próprio cliente. (`/admin/clientes/:id` é só admin.)
 */
export function useClienteLogado() {
  const clienteId = useAuthStore((s) => s.clienteId);
  return useQuery<Cliente | null>({
    queryKey: ['cliente-logado', clienteId],
    queryFn: async () => {
      const eu = await authService.eu();
      if (eu.tipo !== 'CLIENTE' || !eu.cliente) return null;
      return {
        id: eu.cliente.id,
        cnpj: eu.cliente.cnpj,
        razaoSocial: eu.cliente.razaoSocial,
        nomeFantasia: eu.cliente.nomeFantasia ?? undefined,
        email: eu.cliente.email,
        telefone: '',
        endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' },
        status: eu.cliente.status,
        limiteCredito: 0,
        criadoEm: '',
        atualizadoEm: '',
      };
    },
    enabled: Boolean(clienteId),
  });
}
