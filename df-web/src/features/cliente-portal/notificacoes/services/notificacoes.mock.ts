/**
 * @deprecated Mantém o nome original; agora chama df-api via axios.
 * Endpoints usados: /cliente/notificacoes (listar), /cliente/notificacoes/:id/marcar-lida,
 * /cliente/notificacoes/marcar-todas-lidas.
 */
import { api } from '@/services/api/http';
import { fromNotificacaoDTO, type NotificacaoDTO } from '@/services/api/transformers';
import type { Notificacao, UUID } from '@/types';

interface ListagemDTO {
  itens: NotificacaoDTO[];
}

export const notificacoesService = {
  async listar(_clienteId: UUID): Promise<Notificacao[]> {
    // O backend resolve o cliente via cookie de sessão; o `clienteId`
    // é mantido na assinatura por compatibilidade mas não é enviado.
    const { itens } = await api.get<ListagemDTO>('/cliente/notificacoes');
    return itens.map(fromNotificacaoDTO);
  },

  async marcarComoLida(_clienteId: UUID, id: string): Promise<void> {
    await api.post(`/cliente/notificacoes/${id}/marcar-lida`);
  },

  async marcarTodasComoLidas(_clienteId: UUID): Promise<void> {
    await api.post('/cliente/notificacoes/marcar-todas-lidas');
  },
};
