import { api } from '@/services/http';
import type { Notificacao } from '@/types';

interface NotificacaoDTO {
  id: string;
  clienteId: string;
  usuarioClienteId?: string | null;
  faturaId: string | null;
  regraId: string | null;
  canal: 'EMAIL' | 'WHATSAPP' | null;
  titulo: string;
  mensagem: string;
  enviadaEm: string | null;
  lidaEm: string | null;
  erro: string | null;
  criadoEm: string;
  filial?: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string | null;
  } | null;
}

interface ListagemDTO {
  itens: NotificacaoDTO[];
}

function fromDto(dto: NotificacaoDTO): Notificacao {
  return {
    id: dto.id,
    titulo: dto.titulo,
    mensagem: dto.mensagem,
    naoLida: dto.lidaEm == null,
    faturaId: dto.faturaId ?? undefined,
    criadoEm: dto.enviadaEm ?? dto.criadoEm,
    filial: dto.filial
      ? {
          id: dto.filial.id,
          razaoSocial: dto.filial.razaoSocial,
          nomeFantasia: dto.filial.nomeFantasia ?? undefined,
        }
      : undefined,
  };
}

export const notificacoesService = {
  async listar(): Promise<Notificacao[]> {
    const { itens } = await api.get<ListagemDTO>('/cliente/notificacoes');
    return itens.map(fromDto);
  },
  async marcarComoLida(id: string): Promise<void> {
    await api.post(`/cliente/notificacoes/${id}/marcar-lida`);
  },
  async marcarTodasComoLidas(): Promise<void> {
    await api.post('/cliente/notificacoes/marcar-todas-lidas');
  },
};
