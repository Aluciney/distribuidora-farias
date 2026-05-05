import type { ValorEmCentavos } from '@/types';
import { MetodoPagamento } from '@/types';

export interface MovimentacaoDia {
  /** Formato `YYYY-MM-DD`. */
  data: string;
  recebido: ValorEmCentavos;
  previsto: ValorEmCentavos;
}

export interface ResumoMetodo {
  metodo: typeof MetodoPagamento[keyof typeof MetodoPagamento];
  recebido: ValorEmCentavos;
  pendente: ValorEmCentavos;
}

export interface UltimaMovimentacao {
  id: string;
  cliente: string;
  metodo: typeof MetodoPagamento[keyof typeof MetodoPagamento];
  valor: ValorEmCentavos;
  status: 'PAGO' | 'PENDENTE' | 'VENCIDO';
  data: string;
}

export interface FluxoCaixaMensal {
  /** Mês de referência (`YYYY-MM-01`). */
  mesReferencia: string;
  totalRecebido: ValorEmCentavos;
  totalPendente: ValorEmCentavos;
  totalVencido: ValorEmCentavos;
  ticketMedio: ValorEmCentavos;
  totalFaturas: number;
  variacaoMesAnterior: number;
  movimentacoesDiarias: MovimentacaoDia[];
  resumoPorMetodo: ResumoMetodo[];
  ultimasMovimentacoes: UltimaMovimentacao[];
}

const reaisToCentavos = (reais: number): ValorEmCentavos =>
  Math.round(reais * 100);

function gerarMovimentacoesDiarias(mes: string): MovimentacaoDia[] {
  const [anoStr, mesStr] = mes.split('-');
  const ano = Number(anoStr);
  const mesNum = Number(mesStr);
  const totalDias = new Date(ano, mesNum, 0).getDate();
  const seed = ano * 100 + mesNum;
  return Array.from({ length: totalDias }, (_, i) => {
    const dia = i + 1;
    const factor = Math.abs(Math.sin(seed + dia));
    const recebido = reaisToCentavos(2_500 + factor * 9_500);
    const previsto = reaisToCentavos(3_000 + Math.abs(Math.cos(seed + dia)) * 8_000);
    return {
      data: `${mes}-${String(dia).padStart(2, '0')}`,
      recebido,
      previsto,
    };
  });
}

function gerarResumoPorMetodo(seed: number): ResumoMetodo[] {
  const base = (mult: number) => reaisToCentavos(15_000 + (seed % 9) * mult);
  return [
    {
      metodo: MetodoPagamento.BOLETO,
      recebido: base(950),
      pendente: reaisToCentavos(8_400),
    },
    {
      metodo: MetodoPagamento.PIX,
      recebido: base(1_400),
      pendente: reaisToCentavos(3_200),
    },
    {
      metodo: MetodoPagamento.CARTAO_CREDITO,
      recebido: base(620),
      pendente: reaisToCentavos(1_800),
    },
  ];
}

const ULTIMAS_MOVIMENTACOES_BASE: UltimaMovimentacao[] = [
  {
    id: 'mv-001',
    cliente: 'Mercado Central LTDA',
    metodo: MetodoPagamento.PIX,
    valor: reaisToCentavos(4_280.5),
    status: 'PAGO',
    data: '2026-05-04T14:22:00Z',
  },
  {
    id: 'mv-002',
    cliente: 'Padaria Sol Nascente',
    metodo: MetodoPagamento.BOLETO,
    valor: reaisToCentavos(1_950),
    status: 'PENDENTE',
    data: '2026-05-04T11:05:00Z',
  },
  {
    id: 'mv-003',
    cliente: 'Restaurante Sabor Caseiro',
    metodo: MetodoPagamento.CARTAO_CREDITO,
    valor: reaisToCentavos(7_120.9),
    status: 'PAGO',
    data: '2026-05-03T16:48:00Z',
  },
  {
    id: 'mv-004',
    cliente: 'Mercearia do João',
    metodo: MetodoPagamento.BOLETO,
    valor: reaisToCentavos(845),
    status: 'VENCIDO',
    data: '2026-05-02T09:12:00Z',
  },
  {
    id: 'mv-005',
    cliente: 'Empório das Bebidas',
    metodo: MetodoPagamento.PIX,
    valor: reaisToCentavos(3_360),
    status: 'PAGO',
    data: '2026-05-02T08:40:00Z',
  },
];

export function gerarFluxoCaixaMock(mesReferencia: string): FluxoCaixaMensal {
  const movimentacoesDiarias = gerarMovimentacoesDiarias(mesReferencia);
  const totalRecebido = movimentacoesDiarias.reduce((acc, m) => acc + m.recebido, 0);
  const totalPendente = movimentacoesDiarias.reduce((acc, m) => acc + m.previsto, 0);
  const totalVencido = reaisToCentavos(18_400);
  const totalFaturas = 142;
  const ticketMedio = Math.round(totalRecebido / totalFaturas);
  const seed = Number(mesReferencia.replace(/-/g, ''));
  const variacaoMesAnterior = Number(((Math.sin(seed) * 18).toFixed(1)));

  return {
    mesReferencia: `${mesReferencia}-01`,
    totalRecebido,
    totalPendente,
    totalVencido,
    ticketMedio,
    totalFaturas,
    variacaoMesAnterior,
    movimentacoesDiarias,
    resumoPorMetodo: gerarResumoPorMetodo(seed),
    ultimasMovimentacoes: ULTIMAS_MOVIMENTACOES_BASE,
  };
}
