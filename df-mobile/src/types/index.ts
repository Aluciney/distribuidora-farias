/** Tipos espelham o backend df-api (subset usado pelo portal do cliente). */

export type UUID = string;
export type ISODateString = string;
/** Valores monetários sempre em centavos para evitar erros de ponto flutuante. */
export type ValorEmCentavos = number;

export const StatusFatura = {
  PENDENTE: 'PENDENTE',
  PAGO: 'PAGO',
  VENCIDO: 'VENCIDO',
  CANCELADO: 'CANCELADO',
  ESTORNADO: 'ESTORNADO',
} as const;
export type StatusFatura = (typeof StatusFatura)[keyof typeof StatusFatura];

export const MetodoPagamento = {
  BOLETO: 'BOLETO',
  PIX: 'PIX',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  DINHEIRO: 'DINHEIRO',
} as const;
export type MetodoPagamento =
  (typeof MetodoPagamento)[keyof typeof MetodoPagamento];

export interface ClienteSessao {
  id: UUID;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  email: string;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
}

export interface DadosBoleto {
  linhaDigitavel: string;
  codigoBarras: string;
  nossoNumero: string;
}

export interface DadosPix {
  copiaECola: string;
  qrCode: string;
  txid: string;
  expiraEm?: ISODateString;
}

export interface DadosCartao {
  bandeira: string;
  ultimosDigitos: string;
  parcelas: number;
}

export interface PagamentoConfirmado {
  metodo: MetodoPagamento;
  cartao?: DadosCartao;
}

export interface Fatura {
  id: UUID;
  numero: string;
  pedidoId: UUID;
  clienteId: UUID;
  cliente?: {
    id: UUID;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
    email?: string;
    telefone?: string;
  };
  valor: ValorEmCentavos;
  valorPago?: ValorEmCentavos;
  status: StatusFatura;
  dataEmissao: ISODateString;
  dataVencimento: ISODateString;
  dataPagamento?: ISODateString;
  observacoes?: string;
  motivoCancelamento?: string;
  boleto: DadosBoleto;
  pix: DadosPix;
  pagamento?: PagamentoConfirmado;
  criadoEm: ISODateString;
  atualizadoEm: ISODateString;
}

export interface ListagemFaturas {
  itens: Fatura[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  naoLida: boolean;
  faturaId?: UUID;
  criadoEm: ISODateString;
}
