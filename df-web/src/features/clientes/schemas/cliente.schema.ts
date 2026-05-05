import { z } from 'zod';
import { StatusCliente } from '@/types';
import { apenasDigitos, isCNPJValido } from '@/utils/cnpj';

const UF_REGEX = /^[A-Z]{2}$/;

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
    .refine((v) => UF_REGEX.test(v), 'UF deve ter 2 letras (ex: SP).'),
});

export const clienteSchema = z.object({
  cnpj: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length === 14, 'CNPJ deve ter 14 dígitos.')
    .refine(isCNPJValido, 'CNPJ inválido.'),
  razaoSocial: z.string().min(3, 'Razão social deve ter ao menos 3 caracteres.'),
  nomeFantasia: z.string().optional().or(z.literal('')),
  inscricaoEstadual: z.string().optional().or(z.literal('')),
  email: z.email('Informe um email válido.'),
  telefone: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine(
      (v) => v.length === 10 || v.length === 11,
      'Telefone deve ter 10 ou 11 dígitos (com DDD).',
    ),
  endereco: enderecoSchema,
  status: z.enum([
    StatusCliente.ATIVO,
    StatusCliente.INATIVO,
    StatusCliente.BLOQUEADO,
  ]),
  /** Limite em centavos (já convertido pelo form). */
  limiteCredito: z
    .number({ error: 'Informe um valor numérico.' })
    .min(0, 'Limite não pode ser negativo.')
    .max(99_999_999_99, 'Limite excede o máximo permitido.'),
  observacoes: z.string().optional().or(z.literal('')),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;
