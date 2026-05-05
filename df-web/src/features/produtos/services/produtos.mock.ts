import type { Produto } from '@/types';

const reaisToCentavos = (r: number): number => Math.round(r * 100);

/**
 * Mock read-only do catálogo de produtos do ERP de estoque.
 * Em produção esta lista é consultada via API do sistema legado;
 * o sistema financeiro apenas exibe.
 */
const PRODUTOS: Produto[] = [
  {
    id: 'prod-001',
    sku: 'BB-CC-355',
    descricao: 'Cerveja long neck 355ml (cx 24un)',
    unidade: 'CX',
    preco: reaisToCentavos(125),
    estoque: 320,
    ativo: true,
  },
  {
    id: 'prod-002',
    sku: 'BB-RF-2L',
    descricao: 'Refrigerante cola 2L (cx 6un)',
    unidade: 'CX',
    preco: reaisToCentavos(48),
    estoque: 480,
    ativo: true,
  },
  {
    id: 'prod-003',
    sku: 'BB-SC-1L',
    descricao: 'Suco natural integral 1L (cx 12un)',
    unidade: 'CX',
    preco: reaisToCentavos(96),
    estoque: 210,
    ativo: true,
  },
  {
    id: 'prod-004',
    sku: 'AL-FT-25',
    descricao: 'Farinha de trigo especial 25kg',
    unidade: 'SC',
    preco: reaisToCentavos(82.5),
    estoque: 88,
    ativo: true,
  },
  {
    id: 'prod-005',
    sku: 'AL-AR-5',
    descricao: 'Arroz branco tipo 1 5kg',
    unidade: 'PCT',
    preco: reaisToCentavos(28.9),
    estoque: 1_240,
    ativo: true,
  },
  {
    id: 'prod-006',
    sku: 'AL-AC-5',
    descricao: 'Açúcar refinado 5kg',
    unidade: 'PCT',
    preco: reaisToCentavos(36),
    estoque: 540,
    ativo: true,
  },
  {
    id: 'prod-007',
    sku: 'AL-OL-900',
    descricao: 'Óleo de soja 900ml (cx 20un)',
    unidade: 'CX',
    preco: reaisToCentavos(168),
    estoque: 132,
    ativo: true,
  },
  {
    id: 'prod-008',
    sku: 'LP-DT-500',
    descricao: 'Detergente líquido 500ml (cx 24un)',
    unidade: 'CX',
    preco: reaisToCentavos(72),
    estoque: 60,
    ativo: true,
  },
  {
    id: 'prod-009',
    sku: 'BB-AG-500',
    descricao: 'Água mineral sem gás 500ml (fardo 12un)',
    unidade: 'FD',
    preco: reaisToCentavos(18.5),
    estoque: 0,
    ativo: false,
  },
  {
    id: 'prod-010',
    sku: 'AL-CF-500',
    descricao: 'Café torrado e moído 500g',
    unidade: 'UN',
    preco: reaisToCentavos(24.9),
    estoque: 410,
    ativo: true,
  },
  {
    id: 'prod-011',
    sku: 'LP-SA-2L',
    descricao: 'Sabão líquido 2L (cx 6un)',
    unidade: 'CX',
    preco: reaisToCentavos(110),
    estoque: 95,
    ativo: true,
  },
  {
    id: 'prod-012',
    sku: 'BB-EN-250',
    descricao: 'Energético 250ml (cx 24un)',
    unidade: 'CX',
    preco: reaisToCentavos(168),
    estoque: 4,
    ativo: true,
  },
];

const SIMULATED_LATENCY_MS = 250;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

export type FiltroAtivoProduto = 'TODOS' | 'ATIVOS' | 'INATIVOS';

export interface FiltrosProdutos {
  busca?: string;
  ativo?: FiltroAtivoProduto;
}

export const produtosService = {
  async listar(filtros: FiltrosProdutos = {}): Promise<Produto[]> {
    await delay();
    const buscaNorm = (filtros.busca ?? '').trim().toLowerCase();
    return PRODUTOS.filter((p) => {
      if (filtros.ativo === 'ATIVOS' && !p.ativo) return false;
      if (filtros.ativo === 'INATIVOS' && p.ativo) return false;
      if (!buscaNorm) return true;
      return (
        p.descricao.toLowerCase().includes(buscaNorm) ||
        p.sku.toLowerCase().includes(buscaNorm)
      );
    }).sort((a, b) => a.descricao.localeCompare(b.descricao));
  },
};
