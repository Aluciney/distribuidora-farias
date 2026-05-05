import { z } from 'zod'

export const loginAdminInputSchema = z.object({
	email: z.string().email(),
	senha: z.string().min(1),
})

export const loginClienteInputSchema = z.object({
	cnpj: z.string().min(11),
	senha: z.string().min(1),
})

export const definirSenhaInputSchema = z.object({
	cnpj: z.string().min(11),
	senha: z.string().min(4),
})

export const usuarioPublicoSchema = z.object({
	id: z.string(),
	nome: z.string(),
	email: z.string(),
	perfil: z.enum(['ADMIN', 'FINANCEIRO']),
	ativo: z.boolean(),
	ultimoAcesso: z.string().datetime().nullable(),
	criadoEm: z.string().datetime(),
})

export const clientePublicoResumoSchema = z.object({
	id: z.string(),
	cnpj: z.string(),
	razaoSocial: z.string(),
	nomeFantasia: z.string().nullable(),
	email: z.string(),
	status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']),
})

export const respostaLoginAdminSchema = z.object({
	usuario: usuarioPublicoSchema,
	token: z.string(),
})

export const respostaLoginClienteSchema = z.object({
	cliente: clientePublicoResumoSchema,
	token: z.string(),
})

export const respostaEuSchema = z.object({
	tipo: z.enum(['ADMIN', 'CLIENTE']),
	usuario: usuarioPublicoSchema.nullable(),
	cliente: clientePublicoResumoSchema.nullable(),
})

export const erroSchema = z.object({
	erro: z.string(),
	mensagem: z.string(),
	detalhes: z.unknown().optional(),
})
