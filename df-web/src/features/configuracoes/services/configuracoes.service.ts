/**
 * Hooks e service para configurações de cobrança.
 * Backed por `/admin/configuracoes` (GET/PUT) no df-api.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api/http';
import { toast } from '@/store/toast.store';
import {
  CONFIG_PADRAO,
  MENSAGEM_WHATSAPP_BOLETO_PADRAO,
  type ConfiguracoesCobranca,
  type TipoChavePix,
} from '@/features/configuracoes/store/configuracoes.store';

interface ConfigBackendDTO {
  beneficiario: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  };
  banco: {
    codigo: string;
    nome: string;
    agencia: string;
    agenciaDigito: string | null;
    conta: string;
    contaDigito: string;
    carteira: string;
    convenio: string | null;
    proximoNossoNumero: number;
  };
  pix: {
    tipoChave: TipoChavePix;
    chave: string;
  };
  encargos: {
    multaPercentual: number;
    jurosMensalPercentual: number;
    descontoAntecipadoDias: number;
    descontoPercentual: number;
    mensagemPadrao: string | null;
  };
  whatsapp?: {
    mensagemBoleto: string | null;
  };
  atualizadoEm: string;
}

function fromBackend(dto: ConfigBackendDTO): ConfiguracoesCobranca {
  return {
    beneficiario: {
      cnpj: dto.beneficiario.cnpj,
      razaoSocial: dto.beneficiario.razaoSocial,
      nomeFantasia: dto.beneficiario.nomeFantasia ?? '',
      endereco: {
        cep: dto.beneficiario.cep,
        logradouro: dto.beneficiario.logradouro,
        numero: dto.beneficiario.numero,
        complemento: dto.beneficiario.complemento ?? '',
        bairro: dto.beneficiario.bairro,
        cidade: dto.beneficiario.cidade,
        uf: dto.beneficiario.uf,
      },
    },
    banco: {
      codigoBanco: dto.banco.codigo,
      nomeBanco: dto.banco.nome,
      agencia: dto.banco.agencia,
      agenciaDigito: dto.banco.agenciaDigito ?? '',
      conta: dto.banco.conta,
      contaDigito: dto.banco.contaDigito,
      carteira: dto.banco.carteira,
      convenio: dto.banco.convenio ?? '',
      proximoNossoNumero: dto.banco.proximoNossoNumero,
    },
    pix: { tipoChave: dto.pix.tipoChave, chave: dto.pix.chave },
    encargos: {
      multaPercentual: Number(dto.encargos.multaPercentual),
      jurosMensalPercentual: Number(dto.encargos.jurosMensalPercentual),
      descontoAntecipadoDias: dto.encargos.descontoAntecipadoDias,
      descontoPercentual: Number(dto.encargos.descontoPercentual),
      mensagemPadrao: dto.encargos.mensagemPadrao ?? '',
    },
    whatsapp: {
      mensagemBoleto:
        dto.whatsapp?.mensagemBoleto ?? MENSAGEM_WHATSAPP_BOLETO_PADRAO,
    },
  };
}

function toBackend(c: ConfiguracoesCobranca) {
  return {
    beneficiario: {
      cnpj: c.beneficiario.cnpj,
      razaoSocial: c.beneficiario.razaoSocial,
      nomeFantasia: c.beneficiario.nomeFantasia || null,
      cep: c.beneficiario.endereco.cep,
      logradouro: c.beneficiario.endereco.logradouro,
      numero: c.beneficiario.endereco.numero,
      complemento: c.beneficiario.endereco.complemento || null,
      bairro: c.beneficiario.endereco.bairro,
      cidade: c.beneficiario.endereco.cidade,
      uf: c.beneficiario.endereco.uf.toUpperCase(),
    },
    banco: {
      codigo: c.banco.codigoBanco,
      nome: c.banco.nomeBanco,
      agencia: c.banco.agencia,
      agenciaDigito: c.banco.agenciaDigito || null,
      conta: c.banco.conta,
      contaDigito: c.banco.contaDigito,
      carteira: c.banco.carteira,
      convenio: c.banco.convenio || null,
      proximoNossoNumero: c.banco.proximoNossoNumero,
    },
    pix: { tipoChave: c.pix.tipoChave, chave: c.pix.chave },
    encargos: {
      multaPercentual: c.encargos.multaPercentual,
      jurosMensalPercentual: c.encargos.jurosMensalPercentual,
      descontoAntecipadoDias: c.encargos.descontoAntecipadoDias,
      descontoPercentual: c.encargos.descontoPercentual,
      mensagemPadrao: c.encargos.mensagemPadrao || null,
    },
    whatsapp: {
      mensagemBoleto: c.whatsapp?.mensagemBoleto || null,
    },
  };
}

const KEY = ['configuracoes-cobranca'] as const;

export function useConfiguracoes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => fromBackend(await api.get<ConfigBackendDTO>('/admin/configuracoes')),
    staleTime: 5 * 60_000,
  });
}

export function useAtualizarConfiguracoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: ConfiguracoesCobranca) =>
      fromBackend(await api.put<ConfigBackendDTO>('/admin/configuracoes', toBackend(config))),
    onSuccess: (config) => {
      qc.setQueryData(KEY, config);
      toast.sucesso('Configurações salvas', 'Os próximos boletos e PIX usarão estes dados.');
    },
    onError: (err: Error) => toast.erro('Falha ao salvar configurações', err.message),
  });
}

export const CONFIG_FALLBACK = CONFIG_PADRAO;
