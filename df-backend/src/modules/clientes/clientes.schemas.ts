import { z } from 'zod'

export const statusClienteSchema = z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO'])

export const enderecoSchema = z.object({
	cep: z.string().min(8).max(9),
	logradouro: z.string().min(1),
	numero: z.string().min(1),
	complemento: z.string().nullish(),
	bairro: z.string().min(1),
	cidade: z.string().min(1),
	uf: z.string().length(2),
})

export const clienteSchema = z.object({
	id: z.string(),
	cnpj: z.string(),
	razaoSocial: z.string(),
	nomeFantasia: z.string().nullable(),
	inscricaoEstadual: z.string().nullable(),
	email: z.string(),
	telefone: z.string(),
	status: statusClienteSchema,
	limiteCredito: z.number(),
	observacoes: z.string().nullable(),
	endereco: z.object({
		cep: z.string(),
		logradouro: z.string(),
		numero: z.string(),
		complemento: z.string().nullable(),
		bairro: z.string(),
		cidade: z.string(),
		uf: z.string(),
	}),
	criadoEm: z.string().datetime(),
	atualizadoEm: z.string().datetime(),
})

export const listarClientesQuerySchema = z.object({
	busca: z.string().optional(),
	status: statusClienteSchema.optional(),
})

export const criarClienteInputSchema = z.object({
	cnpj: z.string().min(11),
	razaoSocial: z.string().min(2),
	nomeFantasia: z.string().nullish(),
	inscricaoEstadual: z.string().nullish(),
	email: z.string().email(),
	telefone: z.string().min(8),
	limiteCredito: z.number().int().nonnegative().default(0),
	observacoes: z.string().nullish(),
	endereco: enderecoSchema,
	status: statusClienteSchema.default('ATIVO'),
})

export const atualizarClienteInputSchema = z.object({
	razaoSocial: z.string().min(2).optional(),
	nomeFantasia: z.string().nullish(),
	inscricaoEstadual: z.string().nullish(),
	email: z.string().email().optional(),
	telefone: z.string().min(8).optional(),
	limiteCredito: z.number().int().nonnegative().optional(),
	observacoes: z.string().nullish(),
	endereco: enderecoSchema.optional(),
})

export const alterarStatusClienteInputSchema = z.object({
	status: statusClienteSchema,
})
