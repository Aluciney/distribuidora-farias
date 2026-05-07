/**
 * Tipos e constantes de configuração de cobrança.
 *
 * O state da configuração saiu do `zustand` e passou a ser obtido do backend
 * df-api via `useConfiguracoes()` em `services/configuracoes.service.ts`.
 * Este arquivo guarda apenas tipagens, defaults e helpers puros para que
 * outros módulos (formulários, tabelas) continuem importando como antes.
 */
import type { Endereco } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type TipoChavePix =
  | 'CPF'
  | 'CNPJ'
  | 'EMAIL'
  | 'TELEFONE'
  | 'ALEATORIA';

export interface DadosBancarios {
  codigoBanco: string;
  nomeBanco: string;
  agencia: string;
  agenciaDigito?: string;
  conta: string;
  contaDigito: string;
  carteira: string;
  convenio?: string;
  proximoNossoNumero: number;
}

export interface ConfiguracoesPix {
  tipoChave: TipoChavePix;
  chave: string;
}

export interface BeneficiarioCobranca {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco: Endereco;
}

export interface EncargosCobranca {
  multaPercentual: number;
  jurosMensalPercentual: number;
  descontoAntecipadoDias: number;
  descontoPercentual: number;
  mensagemPadrao?: string;
}

export interface ConfiguracoesWhatsapp {
  /** Texto enviado junto com o boleto. Suporta placeholders. */
  mensagemBoleto?: string;
}

export interface ConfiguracoesCobranca {
  beneficiario: BeneficiarioCobranca;
  banco: DadosBancarios;
  pix: ConfiguracoesPix;
  encargos: EncargosCobranca;
  whatsapp: ConfiguracoesWhatsapp;
}

export const MENSAGEM_WHATSAPP_BOLETO_PADRAO =
  'Olá, {cliente}! Segue o boleto da fatura {numero} no valor de {valor}, com vencimento em {vencimento}.\n\nLinha digitável: {linhaDigitavel}\nPIX: {pix}';

// ---------------------------------------------------------------------------
// Catálogo de bancos suportados (subset Febraban)
// ---------------------------------------------------------------------------

export interface BancoSuportado {
  codigo: string;
  nome: string;
}

export const BANCOS_SUPORTADOS: BancoSuportado[] = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '041', nome: 'Banrisul' },
  { codigo: '077', nome: 'Banco Inter' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '260', nome: 'Nu Pagamentos' },
  { codigo: '290', nome: 'PagSeguro' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '380', nome: 'PicPay' },
  { codigo: '422', nome: 'Banco Safra' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '756', nome: 'Sicoob' },
];

// ---------------------------------------------------------------------------
// Defaults — usados como fallback enquanto o backend ainda não respondeu
// ---------------------------------------------------------------------------

export const CONFIG_PADRAO: ConfiguracoesCobranca = {
  beneficiario: {
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
    },
  },
  banco: {
    codigoBanco: '341',
    nomeBanco: 'Itaú Unibanco',
    agencia: '',
    agenciaDigito: '',
    conta: '',
    contaDigito: '',
    carteira: '109',
    convenio: '',
    proximoNossoNumero: 1,
  },
  pix: {
    tipoChave: 'CNPJ',
    chave: '',
  },
  encargos: {
    multaPercentual: 0,
    jurosMensalPercentual: 0,
    descontoAntecipadoDias: 0,
    descontoPercentual: 0,
    mensagemPadrao: '',
  },
  whatsapp: {
    mensagemBoleto: MENSAGEM_WHATSAPP_BOLETO_PADRAO,
  },
};

/** Verifica se a configuração mínima para gerar cobranças está preenchida. */
export function configuracoesProntas(config: ConfiguracoesCobranca): boolean {
  return Boolean(
    config.banco.agencia &&
      config.banco.conta &&
      config.banco.carteira &&
      config.pix.chave,
  );
}
