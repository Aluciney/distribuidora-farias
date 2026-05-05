import { z } from 'zod';
import { apenasDigitos, isCNPJValido } from '@/utils/cnpj';

const enderecoSchema = z.object({
  cep: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length === 8, 'CEP deve ter 8 dígitos.'),
  logradouro: z.string().min(2, 'Informe o logradouro.'),
  numero: z.string().min(1, 'Informe o número.'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Informe o bairro.'),
  cidade: z.string().min(2, 'Informe a cidade.'),
  uf: z
    .string()
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z]{2}$/.test(v), 'UF deve ter 2 letras.'),
});

const beneficiarioSchema = z.object({
  cnpj: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length === 14, 'CNPJ deve ter 14 dígitos.')
    .refine(isCNPJValido, 'CNPJ inválido.'),
  razaoSocial: z.string().min(3, 'Razão social deve ter ao menos 3 caracteres.'),
  nomeFantasia: z.string().optional().or(z.literal('')),
  endereco: enderecoSchema,
});

const bancoSchema = z.object({
  codigoBanco: z
    .string()
    .transform((v) => apenasDigitos(v).padStart(3, '0').slice(-3))
    .refine((v) => v.length === 3, 'Código do banco deve ter 3 dígitos.'),
  nomeBanco: z.string().min(2, 'Informe o nome do banco.'),
  agencia: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length >= 3 && v.length <= 5, 'Agência deve ter 3 a 5 dígitos.'),
  agenciaDigito: z
    .string()
    .max(2, 'Dígito da agência inválido.')
    .optional()
    .or(z.literal('')),
  conta: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length >= 4 && v.length <= 12, 'Conta deve ter entre 4 e 12 dígitos.'),
  contaDigito: z
    .string()
    .min(1, 'Informe o dígito da conta.')
    .max(2, 'Dígito inválido.'),
  carteira: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length >= 1 && v.length <= 4, 'Informe a carteira (1 a 4 dígitos).'),
  convenio: z.string().optional().or(z.literal('')),
  proximoNossoNumero: z
    .number({ error: 'Informe um número.' })
    .int('Deve ser um número inteiro.')
    .min(1, 'Deve ser maior que zero.'),
});

const pixSchema = z
  .object({
    tipoChave: z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA']),
    chave: z.string().min(1, 'Informe a chave PIX.'),
  })
  .superRefine((val, ctx) => {
    const { tipoChave, chave } = val;
    const adicionar = (msg: string) =>
      ctx.addIssue({ code: 'custom', path: ['chave'], message: msg });

    if (tipoChave === 'CPF') {
      if (apenasDigitos(chave).length !== 11) adicionar('CPF deve ter 11 dígitos.');
    }
    if (tipoChave === 'CNPJ') {
      const d = apenasDigitos(chave);
      if (d.length !== 14) adicionar('CNPJ deve ter 14 dígitos.');
      else if (!isCNPJValido(d)) adicionar('CNPJ inválido.');
    }
    if (tipoChave === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave)) {
      adicionar('Email inválido.');
    }
    if (tipoChave === 'TELEFONE') {
      const d = apenasDigitos(chave);
      if (d.length < 10 || d.length > 13) adicionar('Telefone deve ter entre 10 e 13 dígitos.');
    }
    if (tipoChave === 'ALEATORIA' && chave.replace(/-/g, '').length !== 32) {
      adicionar('Chave aleatória deve ter 32 caracteres (UUID).');
    }
  });

const encargosSchema = z.object({
  multaPercentual: z
    .number({ error: 'Informe um número.' })
    .min(0, 'Não pode ser negativo.')
    .max(100, 'Máximo 100%.'),
  jurosMensalPercentual: z
    .number({ error: 'Informe um número.' })
    .min(0, 'Não pode ser negativo.')
    .max(100, 'Máximo 100%.'),
  descontoAntecipadoDias: z
    .number({ error: 'Informe um número inteiro.' })
    .int('Deve ser um número inteiro.')
    .min(0, 'Não pode ser negativo.'),
  descontoPercentual: z
    .number({ error: 'Informe um número.' })
    .min(0, 'Não pode ser negativo.')
    .max(100, 'Máximo 100%.'),
  mensagemPadrao: z.string().max(255, 'Máximo 255 caracteres.').optional().or(z.literal('')),
});

export const configuracoesSchema = z.object({
  beneficiario: beneficiarioSchema,
  banco: bancoSchema,
  pix: pixSchema,
  encargos: encargosSchema,
});

export type ConfiguracoesFormValues = z.infer<typeof configuracoesSchema>;
