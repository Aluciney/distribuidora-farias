/**
 * @deprecated Mantém o nome original; agora chama df-api via axios.
 */
import { api } from '@/services/api/http';
import { fromPedidoDTO, type PedidoBaseDTO, type PedidoDTO } from '@/services/api/transformers';
import type { Pedido, UUID } from '@/types';

export const pedidosService = {
  async listarFaturaveis(): Promise<Pedido[]> {
    const { itens } = await api.get<{ itens: PedidoBaseDTO[] }>('/admin/pedidos/faturaveis');
    return itens.map(fromPedidoDTO);
  },

  async obter(id: UUID): Promise<Pedido | undefined> {
    try {
      return fromPedidoDTO(await api.get<PedidoDTO>(`/admin/pedidos/${id}`));
    } catch {
      return undefined;
    }
  },
};
