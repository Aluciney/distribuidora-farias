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

export const StatusCliente = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  BLOQUEADO: 'BLOQUEADO',
} as const;
export type StatusCliente = (typeof StatusCliente)[keyof typeof StatusCliente];

export const MetodoPagamento = {
  BOLETO: 'BOLETO',
  PIX: 'PIX',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  DINHEIRO: 'DINHEIRO',
} as const;
export type MetodoPagamento =
  (typeof MetodoPagamento)[keyof typeof MetodoPagamento];

/** Filial (loja) acessível pela holding logada. Vem do payload do login. */
export interface FilialAcesso {
  id: UUID;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  status: StatusCliente;
  /** Marca a filial-sede do grupo (informativo). */
  principal: boolean;
}

/** UsuarioCliente (holding) — quem efetivamente faz login no portal. */
export interface UsuarioClienteSessao {
  id: UUID;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  ultimoAcesso?: ISODateString;
  filiais: FilialAcesso[];
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
  /** Resumo da filial à qual a fatura pertence. */
  cliente?: {
    id: UUID;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string;
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
  /** Filial à qual a notificação se refere. */
  filial?: {
    id: UUID;
    razaoSocial: string;
    nomeFantasia?: string;
  };
}
