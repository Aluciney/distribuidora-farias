/**
 * @deprecated Mantém o nome original; agora chama df-api via axios.
 * Endpoints usados: /cliente/notificacoes (listar), /cliente/notificacoes/:id/marcar-lida,
 * /cliente/notificacoes/marcar-todas-lidas.
 */
import { api } from '@/services/api/http';
import { fromNotificacaoDTO, type NotificacaoDTO } from '@/services/api/transformers';
import type { Notificacao } from '@/types';

interface ListagemDTO {
  itens: NotificacaoDTO[];
}

export const notificacoesService = {
  async listar(): Promise<Notificacao[]> {
    // O backend resolve o UsuarioCliente logado via cookie de sessão.
    const { itens } = await api.get<ListagemDTO>('/cliente/notificacoes');
    return itens.map(fromNotificacaoDTO);
  },

  async marcarComoLida(id: string): Promise<void> {
    await api.post(`/cliente/notificacoes/${id}/marcar-lida`);
  },

  async marcarTodasComoLidas(): Promise<void> {
    await api.post('/cliente/notificacoes/marcar-todas-lidas');
  },
};
