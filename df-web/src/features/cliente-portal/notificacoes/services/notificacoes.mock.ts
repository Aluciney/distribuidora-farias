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
  total: number;
  totalNaoLidas: number;
  pagina: number;
  porPagina: number;
}

export interface ListagemNotificacoes {
  itens: Notificacao[];
  total: number;
  totalNaoLidas: number;
  pagina: number;
  porPagina: number;
}

export interface FiltrosNotificacoes {
  pagina?: number;
  porPagina?: number;
}

export const notificacoesService = {
  async listar(filtros: FiltrosNotificacoes = {}): Promise<ListagemNotificacoes> {
    // O backend resolve o UsuarioCliente logado via cookie de sessão.
    const dto = await api.get<ListagemDTO>('/cliente/notificacoes', {
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    });
    return {
      itens: dto.itens.map(fromNotificacaoDTO),
      total: dto.total,
      totalNaoLidas: dto.totalNaoLidas,
      pagina: dto.pagina,
      porPagina: dto.porPagina,
    };
  },

  async marcarComoLida(id: string): Promise<void> {
    await api.post(`/cliente/notificacoes/${id}/marcar-lida`);
  },

  async marcarTodasComoLidas(): Promise<void> {
    await api.post('/cliente/notificacoes/marcar-todas-lidas');
  },
};
