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

export const tipoEntidadeSchema = z.enum(['ADMIN', 'CLIENTE'])

export const alterarSenhaInputSchema = z.object({
	senhaAtual: z.string().min(1),
	senhaNova: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

export const esqueciSenhaInputSchema = z.object({
	tipo: tipoEntidadeSchema,
	/** Email para ADMIN, CNPJ para CLIENTE. */
	identificador: z.string().min(3),
})

export const redefinirSenhaInputSchema = z.object({
	tipo: tipoEntidadeSchema,
	identificador: z.string().min(3),
	codigo: z
		.string()
		.transform((v) => v.replace(/\D/g, ''))
		.refine((v) => v.length === 6, 'Código deve ter 6 dígitos.'),
	senhaNova: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
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
