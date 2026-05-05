import { useQuery } from '@tanstack/react-query';
import { cobrancasService } from '@/features/cobrancas/services/cobrancas.mock';
import { useAuthStore } from '@/store/auth.store';
import type { StatusFatura } from '@/types';

interface FiltrosClienteFaturas {
  status?: StatusFatura | 'TODOS';
}

export function useFaturasCliente(filtros: FiltrosClienteFaturas = {}) {
  const clienteId = useAuthStore((s) => s.clienteId);
  return useQuery({
    queryKey: ['cliente-faturas', clienteId, filtros],
    queryFn: () =>
      clienteId
        ? cobrancasService.listar({ clienteId, status: filtros.status })
        : Promise.resolve([]),
    enabled: Boolean(clienteId),
  });
}
