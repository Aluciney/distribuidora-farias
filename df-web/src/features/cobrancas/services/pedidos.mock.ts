import { StatusPedido, type Pedido, type UUID } from '@/types';

const reaisToCentavos = (r: number): number => Math.round(r * 100);

/**
 * Mock read-only de pedidos vindos do sistema de estoque/ERP.
 * Em produção essa lista é fetchada via API do sistema legado.
 */
const PEDIDOS: Pedido[] = [
  {
    id: 'ped-0001',
    numero: 'PED-2026-0184',
    clienteId: '11111111-1111-1111-1111-111111111111',
    cliente: {
      id: '11111111-1111-1111-1111-111111111111',
      cnpj: '11444777000161',
      razaoSocial: 'Mercado Central LTDA',
    },
    itens: [
      {
        produtoId: 'prod-1',
        descricao: 'Refrigerante 2L (cx 6un)',
        quantidade: 30,
        valorUnitario: reaisToCentavos(48),
        valorTotal: reaisToCentavos(1_440),
      },
      {
        produtoId: 'prod-2',
        descricao: 'Suco natural 1L (cx 12un)',
        quantidade: 15,
        valorUnitario: reaisToCentavos(96),
        valorTotal: reaisToCentavos(1_440),
      },
    ],
    valorTotal: reaisToCentavos(2_880),
    status: StatusPedido.FATURADO,
    emitidoEm: '2026-04-28T10:15:00Z',
  },
  {
    id: 'ped-0002',
    numero: 'PED-2026-0192',
    clienteId: '22222222-2222-2222-2222-222222222222',
    cliente: {
      id: '22222222-2222-2222-2222-222222222222',
      cnpj: '34028316000103',
      razaoSocial: 'Padaria Sol Nascente ME',
    },
    itens: [
      {
        produtoId: 'prod-3',
        descricao: 'Farinha de trigo 25kg',
        quantidade: 10,
        valorUnitario: reaisToCentavos(82.5),
        valorTotal: reaisToCentavos(825),
      },
    ],
    valorTotal: reaisToCentavos(825),
    status: StatusPedido.FATURADO,
    emitidoEm: '2026-04-30T08:40:00Z',
  },
  {
    id: 'ped-0003',
    numero: 'PED-2026-0205',
    clienteId: '33333333-3333-3333-3333-333333333333',
    cliente: {
      id: '33333333-3333-3333-3333-333333333333',
      cnpj: '60746948000112',
      razaoSocial: 'Restaurante Sabor Caseiro EIRELI',
    },
    itens: [
      {
        produtoId: 'prod-4',
        descricao: 'Óleo de soja 900ml (cx 20un)',
        quantidade: 8,
        valorUnitario: reaisToCentavos(168),
        valorTotal: reaisToCentavos(1_344),
      },
      {
        produtoId: 'prod-5',
        descricao: 'Açúcar refinado 5kg',
        quantidade: 25,
        valorUnitario: reaisToCentavos(36),
        valorTotal: reaisToCentavos(900),
      },
    ],
    valorTotal: reaisToCentavos(2_244),
    status: StatusPedido.ABERTO,
    emitidoEm: '2026-05-02T14:20:00Z',
  },
  {
    id: 'ped-0004',
    numero: 'PED-2026-0211',
    clienteId: '55555555-5555-5555-5555-555555555555',
    cliente: {
      id: '55555555-5555-5555-5555-555555555555',
      cnpj: '07526557000100',
      razaoSocial: 'Empório das Bebidas LTDA',
    },
    itens: [
      {
        produtoId: 'prod-6',
        descricao: 'Cerveja long neck 355ml (cx 24un)',
        quantidade: 50,
        valorUnitario: reaisToCentavos(125),
        valorTotal: reaisToCentavos(6_250),
      },
    ],
    valorTotal: reaisToCentavos(6_250),
    status: StatusPedido.ABERTO,
    emitidoEm: '2026-05-03T09:05:00Z',
  },
  {
    id: 'ped-0005',
    numero: 'PED-2026-0220',
    clienteId: '11111111-1111-1111-1111-111111111111',
    cliente: {
      id: '11111111-1111-1111-1111-111111111111',
      cnpj: '11444777000161',
      razaoSocial: 'Mercado Central LTDA',
    },
    itens: [
      {
        produtoId: 'prod-7',
        descricao: 'Arroz tipo 1 5kg',
        quantidade: 100,
        valorUnitario: reaisToCentavos(28.9),
        valorTotal: reaisToCentavos(2_890),
      },
    ],
    valorTotal: reaisToCentavos(2_890),
    status: StatusPedido.ABERTO,
    emitidoEm: '2026-05-04T11:30:00Z',
  },
];

const SIMULATED_LATENCY_MS = 250;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

export const pedidosService = {
  async listarFaturaveis(): Promise<Pedido[]> {
    await delay();
    return PEDIDOS.filter(
      (p) =>
        p.status === StatusPedido.ABERTO ||
        p.status === StatusPedido.FATURADO,
    ).sort((a, b) =>
      a.emitidoEm < b.emitidoEm ? 1 : a.emitidoEm > b.emitidoEm ? -1 : 0,
    );
  },

  async obter(id: UUID): Promise<Pedido | undefined> {
    await delay();
    return PEDIDOS.find((p) => p.id === id);
  },
};
