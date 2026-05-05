/**
 * @deprecated Mantém o nome original; agora chama df-api via axios.
 *
 * O backend `/admin/fluxo-caixa?mes=YYYY-MM` retorna uma estrutura próxima da
 * exibida na tela. Este módulo expõe `gerarFluxoCaixaMock(mes)` que agora
 * é uma chamada HTTP — o nome foi mantido para preservar imports.
 */
import { api } from '@/services/api/http';
import { MetodoPagamento, type ValorEmCentavos } from '@/types';

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

interface BackendDTO {
  mes: string;
  totalRecebido: number;
  totalPendente: number;
  totalVencido: number;
  ticketMedio: number;
  movimentacoesDiarias: {
    dia: string;
    totalRecebido: number;
    totalPendente: number;
    totalVencido: number;
  }[];
  resumoPorMetodo: {
    metodo: 'BOLETO' | 'PIX' | 'CARTAO_CREDITO' | 'DINHEIRO';
    valor: number;
    quantidade: number;
  }[];
  ultimasMovimentacoes: {
    id: string;
    tipo: 'RECEBIMENTO' | 'PENDENCIA';
    clienteRazaoSocial: string;
    faturaNumero: string;
    valor: number;
    data: string;
    metodo: 'BOLETO' | 'PIX' | 'CARTAO_CREDITO' | 'DINHEIRO' | null;
  }[];
  variacaoMesAnterior: number;
}

export async function gerarFluxoCaixaMock(mesReferencia: string): Promise<FluxoCaixaMensal> {
  const dto = await api.get<BackendDTO>('/admin/fluxo-caixa', { mes: mesReferencia });

  // Métodos zerados são preenchidos para manter shape estável na UI.
  const todosMetodos = [
    MetodoPagamento.BOLETO,
    MetodoPagamento.PIX,
    MetodoPagamento.CARTAO_CREDITO,
    MetodoPagamento.DINHEIRO,
  ];
  const mapaMetodos = new Map(dto.resumoPorMetodo.map((m) => [m.metodo, m]));

  return {
    mesReferencia: `${dto.mes}-01`,
    totalRecebido: dto.totalRecebido,
    totalPendente: dto.totalPendente,
    totalVencido: dto.totalVencido,
    ticketMedio: dto.ticketMedio,
    totalFaturas:
      dto.resumoPorMetodo.reduce((s, m) => s + m.quantidade, 0) +
      dto.movimentacoesDiarias.reduce((s, _d) => s + 0, 0),
    variacaoMesAnterior: dto.variacaoMesAnterior,
    movimentacoesDiarias: dto.movimentacoesDiarias.map((d) => ({
      data: d.dia,
      recebido: d.totalRecebido,
      previsto: d.totalPendente,
    })),
    resumoPorMetodo: todosMetodos.map((metodo) => {
      const item = mapaMetodos.get(metodo);
      return {
        metodo,
        recebido: item?.valor ?? 0,
        pendente: 0,
      };
    }),
    ultimasMovimentacoes: dto.ultimasMovimentacoes.map((u) => ({
      id: u.id,
      cliente: u.clienteRazaoSocial,
      metodo: u.metodo ?? MetodoPagamento.BOLETO,
      valor: u.valor,
      status:
        u.tipo === 'RECEBIMENTO'
          ? 'PAGO'
          : new Date(u.data).getTime() < Date.now()
            ? 'VENCIDO'
            : 'PENDENTE',
      data: u.data,
    })),
  };
}
