/**
 * Conversores entre as DTOs do backend (que usam `null` para campos
 * opcionais) e os tipos do front (que usam `undefined` em campos `?:`).
 */

import type {
  Cliente,
  DadosBoleto,
  DadosCartao,
  DadosPix,
  Fatura,
  Notificacao,
  Pedido,
  Produto,
  RegraCobranca,
  StatusFatura,
  Usuario,
  UsuarioCliente,
} from '@/types';

const undef = <T,>(v: T | null | undefined): T | undefined => (v == null ? undefined : v);

// ---------------------------------------------------------------------------
// Usuário
// ---------------------------------------------------------------------------

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'FINANCEIRO';
  ativo: boolean;
  ultimoAcesso: string | null;
  criadoEm: string;
  atualizadoEm?: string;
}

export function fromUsuarioDTO(dto: UsuarioDTO): Usuario {
  return {
    id: dto.id,
    nome: dto.nome,
    email: dto.email,
    perfil: dto.perfil,
    ativo: dto.ativo,
    ultimoAcesso: undef(dto.ultimoAcesso),
    criadoEm: dto.criadoEm,
  };
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export interface ClienteDTO {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  inscricaoEstadual: string | null;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  limiteCredito: number;
  observacoes: string | null;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  };
  criadoEm: string;
  atualizadoEm: string;
}

export function fromClienteDTO(dto: ClienteDTO): Cliente {
  return {
    id: dto.id,
    cnpj: dto.cnpj,
    razaoSocial: dto.razaoSocial,
    nomeFantasia: undef(dto.nomeFantasia),
    inscricaoEstadual: undef(dto.inscricaoEstadual),
    status: dto.status,
    limiteCredito: dto.limiteCredito,
    observacoes: undef(dto.observacoes),
    endereco: {
      cep: dto.endereco.cep,
      logradouro: dto.endereco.logradouro,
      numero: dto.endereco.numero,
      complemento: undef(dto.endereco.complemento),
      bairro: dto.endereco.bairro,
      cidade: dto.endereco.cidade,
      uf: dto.endereco.uf,
    },
    criadoEm: dto.criadoEm,
    atualizadoEm: dto.atualizadoEm,
  };
}

// ---------------------------------------------------------------------------
// UsuarioCliente (holding)
// ---------------------------------------------------------------------------

export interface UsuarioClienteDTO {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  senhaDefinida?: boolean;
  ultimoAcesso: string | null;
  criadoEm?: string;
  filiais: {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
    principal: boolean;
    /** Presente nos endpoints admin (POST/GET de UsuarioCliente). */
    vinculadoEm?: string;
  }[];
}

export function fromUsuarioClienteDTO(dto: UsuarioClienteDTO): UsuarioCliente {
  return {
    id: dto.id,
    nome: dto.nome,
    email: dto.email,
    telefone: dto.telefone,
    ativo: dto.ativo,
    senhaDefinida: dto.senhaDefinida,
    ultimoAcesso: undef(dto.ultimoAcesso),
    filiais: dto.filiais.map((f) => ({
      id: f.id,
      cnpj: f.cnpj,
      razaoSocial: f.razaoSocial,
      nomeFantasia: f.nomeFantasia ?? undefined,
      status: f.status,
      principal: f.principal,
    })),
  };
}

// ---------------------------------------------------------------------------
// Pedido
// ---------------------------------------------------------------------------

export interface PedidoBaseDTO {
  id: string;
  numero: string;
  clienteId: string;
  cliente?: { id: string; cnpj: string; razaoSocial: string } | null;
  valorTotal: number;
  status: 'ABERTO' | 'FATURADO' | 'ENTREGUE' | 'CANCELADO';
  emitidoEm: string;
  observacoes: string | null;
}

export interface PedidoDTO extends PedidoBaseDTO {
  itens: {
    id: string;
    produtoId: string | null;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }[];
}

export function fromPedidoDTO(dto: PedidoDTO | PedidoBaseDTO): Pedido {
  return {
    id: dto.id,
    numero: dto.numero,
    clienteId: dto.clienteId,
    cliente: dto.cliente
      ? { id: dto.cliente.id, cnpj: dto.cliente.cnpj, razaoSocial: dto.cliente.razaoSocial }
      : undefined,
    itens:
      'itens' in dto
        ? dto.itens.map((i) => ({
            produtoId: i.produtoId ?? '',
            descricao: i.descricao,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario,
            valorTotal: i.valorTotal,
          }))
        : [],
    valorTotal: dto.valorTotal,
    status: dto.status,
    emitidoEm: dto.emitidoEm,
    observacoes: undef(dto.observacoes),
  };
}

// ---------------------------------------------------------------------------
// Produto
// ---------------------------------------------------------------------------

export interface ProdutoDTO {
  id: string;
  sku: string;
  descricao: string;
  unidade: string;
  preco: number;
  estoque: number;
  ativo: boolean;
}

export function fromProdutoDTO(dto: ProdutoDTO): Produto {
  return {
    id: dto.id,
    sku: dto.sku,
    descricao: dto.descricao,
    unidade: dto.unidade,
    preco: dto.preco,
    estoque: dto.estoque,
    ativo: dto.ativo,
  };
}

// ---------------------------------------------------------------------------
// Fatura
// ---------------------------------------------------------------------------

export interface FaturaDTO {
  id: string;
  numero: string;
  pedidoId: string;
  clienteId: string;
  cliente?: {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia?: string | null;
  } | null;
  valor: number;
  valorPago: number | null;
  status: StatusFatura;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento: string | null;
  observacoes: string | null;
  boleto: {
    linhaDigitavel: string;
    codigoBarras: string;
    nossoNumero: string;
    url: string | null;
  };
  pix: {
    copiaECola: string;
    qrCode: string;
    txid: string;
    expiraEm: string | null;
  };
  pagamento: {
    metodo: 'BOLETO' | 'PIX' | 'CARTAO_CREDITO' | 'DINHEIRO';
    cartao: {
      bandeira: string;
      ultimosDigitos: string;
      parcelas: number;
      authorizationId: string;
    } | null;
  } | null;
  cancelamento: { motivo: string; canceladoEm: string } | null;
  criadoEm: string;
  atualizadoEm: string;
}

export function fromFaturaDTO(dto: FaturaDTO): Fatura {
  const boleto: DadosBoleto = {
    linhaDigitavel: dto.boleto.linhaDigitavel,
    codigoBarras: dto.boleto.codigoBarras,
    nossoNumero: dto.boleto.nossoNumero,
    urlBoleto: undef(dto.boleto.url),
  };
  const pix: DadosPix = {
    copiaECola: dto.pix.copiaECola,
    qrCode: dto.pix.qrCode,
    txid: dto.pix.txid,
    expiraEm: undef(dto.pix.expiraEm),
  };
  const cartao: DadosCartao | undefined = dto.pagamento?.cartao
    ? {
        bandeira: dto.pagamento.cartao.bandeira,
        ultimosDigitos: dto.pagamento.cartao.ultimosDigitos,
        parcelas: dto.pagamento.cartao.parcelas,
        authorizationId: dto.pagamento.cartao.authorizationId,
      }
    : undefined;
  return {
    id: dto.id,
    numero: dto.numero,
    pedidoId: dto.pedidoId,
    clienteId: dto.clienteId,
    cliente: dto.cliente
      ? {
          id: dto.cliente.id,
          cnpj: dto.cliente.cnpj,
          razaoSocial: dto.cliente.razaoSocial,
          nomeFantasia: dto.cliente.nomeFantasia ?? undefined,
        }
      : undefined,
    valor: dto.valor,
    valorPago: undef(dto.valorPago),
    status: dto.status,
    dataEmissao: dto.dataEmissao,
    dataVencimento: dto.dataVencimento,
    dataPagamento: undef(dto.dataPagamento),
    boleto,
    pix,
    pagamento: dto.pagamento
      ? { metodo: dto.pagamento.metodo, cartao }
      : undefined,
    motivoCancelamento: dto.cancelamento?.motivo,
    observacoes: undef(dto.observacoes),
    criadoEm: dto.criadoEm,
    atualizadoEm: dto.atualizadoEm,
  };
}

// ---------------------------------------------------------------------------
// Régua de Cobrança
// ---------------------------------------------------------------------------

export interface RegraDTO {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  gatilho: 'ANTES_VENCIMENTO' | 'DIA_VENCIMENTO' | 'APOS_VENCIMENTO';
  diasOffset: number;
  acoes: {
    id: string;
    canal: 'EMAIL' | 'WHATSAPP';
    assunto: string | null;
    mensagem: string;
  }[];
  criadoEm: string;
  atualizadoEm: string;
}

export function fromRegraDTO(dto: RegraDTO): RegraCobranca {
  return {
    id: dto.id,
    nome: dto.nome,
    descricao: undef(dto.descricao),
    ativo: dto.ativo,
    gatilho: dto.gatilho,
    diasOffset: dto.diasOffset,
    acoes: dto.acoes.map((a) => ({
      canal: a.canal,
      assunto: undef(a.assunto),
      mensagem: a.mensagem,
    })),
    criadoEm: dto.criadoEm,
    atualizadoEm: dto.atualizadoEm,
  };
}

// ---------------------------------------------------------------------------
// Notificação
// ---------------------------------------------------------------------------

export interface NotificacaoDTO {
  id: string;
  clienteId: string;
  usuarioClienteId?: string | null;
  faturaId: string | null;
  regraId: string | null;
  canal: 'EMAIL' | 'WHATSAPP' | null;
  titulo: string;
  mensagem: string;
  enviadaEm: string | null;
  lidaEm: string | null;
  erro: string | null;
  criadoEm: string;
  filial?: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string | null;
  } | null;
}

export function fromNotificacaoDTO(dto: NotificacaoDTO): Notificacao {
  return {
    id: dto.id,
    titulo: dto.titulo,
    mensagem: dto.mensagem,
    naoLida: dto.lidaEm == null,
    faturaId: undef(dto.faturaId),
    criadoEm: dto.enviadaEm ?? dto.criadoEm,
    filial: dto.filial
      ? {
          id: dto.filial.id,
          razaoSocial: dto.filial.razaoSocial,
          nomeFantasia: dto.filial.nomeFantasia ?? undefined,
        }
      : undefined,
  };
}
