import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Endereco } from '@/types';

// ---------------------------------------------------------------------------
// Tipos da configuração de cobrança
// ---------------------------------------------------------------------------

export type TipoChavePix =
  | 'CPF'
  | 'CNPJ'
  | 'EMAIL'
  | 'TELEFONE'
  | 'ALEATORIA';

export interface DadosBancarios {
  /** Código FEBRABAN do banco (3 dígitos). */
  codigoBanco: string;
  nomeBanco: string;
  agencia: string;
  agenciaDigito?: string;
  conta: string;
  contaDigito: string;
  /** Carteira/operação Febraban (ex: 109, 175, 17). */
  carteira: string;
  /** Convênio (alguns bancos exigem). */
  convenio?: string;
  /** Próximo "nosso número" sequencial — usado para gerar boletos. */
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
  /** Multa aplicada após o vencimento (% sobre o valor). */
  multaPercentual: number;
  /** Juros mensais por mora (% ao mês, calculado pro-rata diário). */
  jurosMensalPercentual: number;
  /** Dias antes do vencimento elegíveis para desconto antecipado. */
  descontoAntecipadoDias: number;
  /** Percentual de desconto antecipado. */
  descontoPercentual: number;
  /** Mensagem padrão impressa no boleto. */
  mensagemPadrao?: string;
}

export interface ConfiguracoesCobranca {
  beneficiario: BeneficiarioCobranca;
  banco: DadosBancarios;
  pix: ConfiguracoesPix;
  encargos: EncargosCobranca;
}

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
// Defaults — preenchidos no primeiro acesso
// ---------------------------------------------------------------------------

export const CONFIG_PADRAO: ConfiguracoesCobranca = {
  beneficiario: {
    cnpj: '12345678000199',
    razaoSocial: 'Distribuidora Farias LTDA',
    nomeFantasia: 'Distribuidora Farias',
    endereco: {
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1500',
      complemento: 'Andar 12',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
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
    proximoNossoNumero: 100001,
  },
  pix: {
    tipoChave: 'CNPJ',
    chave: '12345678000199',
  },
  encargos: {
    multaPercentual: 2,
    jurosMensalPercentual: 1,
    descontoAntecipadoDias: 0,
    descontoPercentual: 0,
    mensagemPadrao: 'Pagamento referente a fornecimento - Distribuidora Farias',
  },
};

// ---------------------------------------------------------------------------
// Store persistido em localStorage
// ---------------------------------------------------------------------------

interface ConfiguracoesState {
  config: ConfiguracoesCobranca;
  atualizar: (config: ConfiguracoesCobranca) => void;
  /** Incrementa e devolve o próximo "nosso número". */
  consumirNossoNumero: () => number;
}

export const useConfiguracoesStore = create<ConfiguracoesState>()(
  persist(
    (set, get) => ({
      config: CONFIG_PADRAO,
      atualizar: (config) => set({ config }),
      consumirNossoNumero: () => {
        const atual = get().config.banco.proximoNossoNumero;
        set({
          config: {
            ...get().config,
            banco: {
              ...get().config.banco,
              proximoNossoNumero: atual + 1,
            },
          },
        });
        return atual;
      },
    }),
    { name: 'df-pagamentos:configuracoes', version: 1 },
  ),
);

/** Atalho síncrono para uso em mocks/serviços (fora de componentes React). */
export function getConfiguracoes(): ConfiguracoesCobranca {
  return useConfiguracoesStore.getState().config;
}

/** Verifica se a configuração mínima para gerar cobranças está preenchida. */
export function configuracoesProntas(config: ConfiguracoesCobranca): boolean {
  return Boolean(
    config.banco.agencia &&
      config.banco.conta &&
      config.banco.carteira &&
      config.pix.chave,
  );
}
