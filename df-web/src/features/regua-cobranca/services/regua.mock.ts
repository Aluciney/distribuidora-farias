/**
 * @deprecated Mantém o nome original; agora chama df-api via axios.
 */
import { api } from '@/services/api/http';
import { fromRegraDTO, type RegraDTO } from '@/services/api/transformers';
import type { RegraCobranca, UUID } from '@/types';

export type DadosRegra = Omit<RegraCobranca, 'id' | 'criadoEm' | 'atualizadoEm'>;

interface ListagemDTO {
  itens: RegraDTO[];
}

function toBackendBody(dados: DadosRegra) {
  return {
    nome: dados.nome,
    descricao: dados.descricao ?? null,
    ativo: dados.ativo,
    gatilho: dados.gatilho,
    diasOffset: dados.diasOffset,
    acoes: dados.acoes.map((a) => ({
      canal: a.canal,
      assunto: a.assunto ?? null,
      mensagem: a.mensagem,
    })),
  };
}

export const reguaService = {
  async listar(): Promise<RegraCobranca[]> {
    const { itens } = await api.get<ListagemDTO>('/admin/regras');
    return itens.map(fromRegraDTO);
  },

  async obter(id: UUID): Promise<RegraCobranca | undefined> {
    const todas = await this.listar();
    return todas.find((r) => r.id === id);
  },

  async criar(dados: DadosRegra): Promise<RegraCobranca> {
    return fromRegraDTO(await api.post<RegraDTO>('/admin/regras', toBackendBody(dados)));
  },

  async atualizar(id: UUID, dados: DadosRegra): Promise<RegraCobranca> {
    return fromRegraDTO(await api.put<RegraDTO>(`/admin/regras/${id}`, toBackendBody(dados)));
  },

  async alternarAtivo(id: UUID): Promise<RegraCobranca> {
    const atual = await this.obter(id);
    if (!atual) throw new Error('Regra não encontrada.');
    return fromRegraDTO(
      await api.patch<RegraDTO>(`/admin/regras/${id}/ativo`, { ativo: !atual.ativo }),
    );
  },

  async excluir(id: UUID): Promise<void> {
    await api.delete(`/admin/regras/${id}`);
  },
};
