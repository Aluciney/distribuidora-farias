/**
 * @deprecated Mantém o nome original; agora chama df-api via axios.
 */
import { api } from '@/services/api/http';
import { fromProdutoDTO, type ProdutoDTO } from '@/services/api/transformers';
import type { Produto } from '@/types';

export type FiltroAtivoProduto = 'TODOS' | 'ATIVOS' | 'INATIVOS';

export interface FiltrosProdutos {
  busca?: string;
  ativo?: FiltroAtivoProduto;
}

export const produtosService = {
  async listar(filtros: FiltrosProdutos = {}): Promise<Produto[]> {
    const ativo =
      filtros.ativo === 'ATIVOS' ? 'true' : filtros.ativo === 'INATIVOS' ? 'false' : undefined;
    const { itens } = await api.get<{ itens: ProdutoDTO[] }>('/admin/produtos', {
      busca: filtros.busca,
      ativo,
    });
    return itens.map(fromProdutoDTO);
  },
};
