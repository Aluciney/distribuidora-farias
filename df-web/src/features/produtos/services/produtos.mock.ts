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
  pagina?: number;
  porPagina?: number;
}

export interface ListagemProdutos {
  itens: Produto[];
  total: number;
  pagina: number;
  porPagina: number;
}

interface ListagemDTO {
  itens: ProdutoDTO[];
  total: number;
  pagina: number;
  porPagina: number;
}

export const produtosService = {
  async listar(filtros: FiltrosProdutos = {}): Promise<ListagemProdutos> {
    const ativo =
      filtros.ativo === 'ATIVOS' ? 'true' : filtros.ativo === 'INATIVOS' ? 'false' : undefined;
    const dto = await api.get<ListagemDTO>('/admin/produtos', {
      busca: filtros.busca,
      ativo,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    });
    return {
      itens: dto.itens.map(fromProdutoDTO),
      total: dto.total,
      pagina: dto.pagina,
      porPagina: dto.porPagina,
    };
  },
};
