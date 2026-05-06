/**
 * Tipagens centrais do Sistema de Gestão de Pagamentos - Distribuidora Farias.
 * Único ponto de verdade para entidades de domínio.
 */

// ---------------------------------------------------------------------------
// Primitivos / Aliases
// ---------------------------------------------------------------------------

export type UUID = string;
/** Datas trafegadas como ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`). */
export type ISODateString = string;
/** Valores monetários em centavos para evitar erros de ponto flutuante. */
export type ValorEmCentavos = number;

// ---------------------------------------------------------------------------
// Enums de domínio
// ---------------------------------------------------------------------------

export const StatusCliente = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  BLOQUEADO: 'BLOQUEADO',
} as const;
export type StatusCliente = (typeof StatusCliente)[keyof typeof StatusCliente];

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
export type MetodoPagamento = (typeof MetodoPagamento)[keyof typeof MetodoPagamento];

export const StatusPedido = {
  ABERTO: 'ABERTO',
  FATURADO: 'FATURADO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO',
} as const;
export type StatusPedido = (typeof StatusPedido)[keyof typeof StatusPedido];

export const PerfilUsuario = {
  ADMIN: 'ADMIN',
  FINANCEIRO: 'FINANCEIRO',
  CLIENTE: 'CLIENTE',
} as const;
export type PerfilUsuario = (typeof PerfilUsuario)[keyof typeof PerfilUsuario];

export const CanalNotificacao = {
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
} as const;
export type CanalNotificacao = (typeof CanalNotificacao)[keyof typeof CanalNotificacao];

export const GatilhoRegua = {
  ANTES_VENCIMENTO: 'ANTES_VENCIMENTO',
  DIA_VENCIMENTO: 'DIA_VENCIMENTO',
  APOS_VENCIMENTO: 'APOS_VENCIMENTO',
} as const;
export type GatilhoRegua = (typeof GatilhoRegua)[keyof typeof GatilhoRegua];

// ---------------------------------------------------------------------------
// Endereço
// ---------------------------------------------------------------------------

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export interface Cliente {
  id: UUID;
  /** Identificador único de negócio. Sempre apenas dígitos (14). */
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  email: string;
  telefone: string;
  endereco: Endereco;
  status: StatusCliente;
  /** Limite de crédito concedido em centavos. */
  limiteCredito: ValorEmCentavos;
  observacoes?: string;
  criadoEm: ISODateString;
  atualizadoEm: ISODateString;
}

// ---------------------------------------------------------------------------
// Pedido (origem da cobrança - integração com sistema de estoque existente)
// ---------------------------------------------------------------------------

export interface ItemPedido {
  produtoId: UUID;
  descricao: string;
  quantidade: number;
  valorUnitario: ValorEmCentavos;
  valorTotal: ValorEmCentavos;
}

export interface Pedido {
  id: UUID;
  numero: string;
  clienteId: UUID;
  cliente?: Pick<Cliente, 'id' | 'cnpj' | 'razaoSocial'>;
  itens: ItemPedido[];
  valorTotal: ValorEmCentavos;
  status: StatusPedido;
  emitidoEm: ISODateString;
  observacoes?: string;
}

// ---------------------------------------------------------------------------
// Fatura - cobrança híbrida (Boleto + PIX gerados juntos)
// ---------------------------------------------------------------------------

export interface DadosBoleto {
  /** Linha digitável formatada (47 dígitos com separadores). */
  linhaDigitavel: string;
  /** Código de barras (44 dígitos). */
  codigoBarras: string;
  nossoNumero: string;
  /** URL para download do PDF. */
  urlBoleto?: string;
}

export interface DadosPix {
  /** Payload "Copia e Cola" no padrão BR Code. */
  copiaECola: string;
  /** Imagem do QR Code em base64 ou URL. */
  qrCode: string;
  /** Identificador da transação (txid Bacen). */
  txid: string;
  /** PIX estático não tem expiração; dinâmico sim. */
  expiraEm?: ISODateString;
}

export interface DadosCartao {
  bandeira: string;
  /** Últimos 4 dígitos exibíveis. */
  ultimosDigitos: string;
  parcelas: number;
  /** ID retornado pelo gateway (mockado nesta fase). */
  authorizationId?: string;
}

/** Confirmação de pagamento — preenchido quando status === PAGO. */
export interface PagamentoConfirmado {
  metodo: MetodoPagamento;
  /** Detalhes apenas quando metodo === CARTAO_CREDITO. */
  cartao?: DadosCartao;
}

export interface Fatura {
  id: UUID;
  numero: string;
  pedidoId: UUID;
  clienteId: UUID;
  cliente?: Pick<Cliente, 'id' | 'cnpj' | 'razaoSocial'> & {
    nomeFantasia?: string;
    email?: string;
    telefone?: string;
  };
  valor: ValorEmCentavos;
  /** Valor pago (parcial ou total). */
  valorPago?: ValorEmCentavos;
  status: StatusFatura;
  dataEmissao: ISODateString;
  dataVencimento: ISODateString;
  dataPagamento?: ISODateString;
  /** Toda cobrança gera Boleto e PIX simultaneamente. */
  boleto: DadosBoleto;
  pix: DadosPix;
  /** Forma efetiva de pagamento — preenchido quando status === PAGO. */
  pagamento?: PagamentoConfirmado;
  /** Motivo do cancelamento (padrão Febraban) — quando status === CANCELADO. */
  motivoCancelamento?: string;
  observacoes?: string;
  criadoEm: ISODateString;
  atualizadoEm: ISODateString;
}

// ---------------------------------------------------------------------------
// Régua de Cobrança
// ---------------------------------------------------------------------------

export interface AcaoRegua {
  canal: CanalNotificacao;
  /** Template da mensagem com placeholders ({{cliente}}, {{valor}}, {{vencimento}}). */
  mensagem: string;
  assunto?: string;
}

export interface RegraCobranca {
  id: UUID;
  nome: string;
  descricao?: string;
  ativo: boolean;
  gatilho: GatilhoRegua;
  /** Quantidade de dias relativa ao vencimento (positivo = depois, negativo = antes). */
  diasOffset: number;
  acoes: AcaoRegua[];
  criadoEm: ISODateString;
  atualizadoEm: ISODateString;
}

// ---------------------------------------------------------------------------
// Usuários internos (Admin/Financeiro)
// ---------------------------------------------------------------------------

export interface Usuario {
  id: UUID;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  ultimoAcesso?: ISODateString;
  criadoEm: ISODateString;
}

// ---------------------------------------------------------------------------
// Produtos (read-only - integração com sistema de estoque)
// ---------------------------------------------------------------------------

export interface Produto {
  id: UUID;
  sku: string;
  descricao: string;
  unidade: string;
  preco: ValorEmCentavos;
  estoque: number;
  ativo: boolean;
}

// ---------------------------------------------------------------------------
// Notificações (Portal do Cliente)
// ---------------------------------------------------------------------------

export interface Notificacao {
  id: UUID;
  titulo: string;
  mensagem: string;
  /** Quando true, ainda não foi visualizada pelo destinatário. */
  naoLida: boolean;
  faturaId?: UUID;
  criadoEm: ISODateString;
}

// ---------------------------------------------------------------------------
// Helpers de filtros / paginação
// ---------------------------------------------------------------------------

export interface PaginacaoParams {
  pagina: number;
  porPagina: number;
}

export interface RespostaPaginada<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface IntervaloDatas {
  inicio: ISODateString;
  fim: ISODateString;
}
