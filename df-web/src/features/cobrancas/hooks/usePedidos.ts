import { useQuery } from '@tanstack/react-query';
import { pedidosService } from '@/features/cobrancas/services/pedidos.mock';
import type { UUID } from '@/types';

export function usePedidosFaturaveis() {
  return useQuery({
    queryKey: ['pedidos', 'faturaveis'],
    queryFn: () => pedidosService.listarFaturaveis(),
  });
}

export function usePedido(id: UUID | undefined) {
  return useQuery({
    queryKey: ['pedidos', 'detalhe', id],
    queryFn: () => pedidosService.obter(id!),
    enabled: Boolean(id),
  });
}
