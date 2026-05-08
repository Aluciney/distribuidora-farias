import { z } from 'zod'

const telefone = z
	.string()
	.transform((v) => v.replace(/\D/g, ''))
	.refine(
		(v) => v.length === 10 || v.length === 11,
		'Telefone deve ter 10 ou 11 dígitos (com DDD).',
	)

const filialResumoSchema = z.object({
	id: z.string(),
	cnpj: z.string(),
	razaoSocial: z.string(),
	nomeFantasia: z.string().nullable(),
	status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']),
	principal: z.boolean(),
	vinculadoEm: z.string().datetime(),
})

export const usuarioClienteSchema = z.object({
	id: z.string(),
	nome: z.string(),
	email: z.string(),
	telefone: z.string(),
	ativo: z.boolean(),
	/// `null` quando o usuário ainda não definiu a senha inicial (foi convidado mas não acessou).
	senhaDefinida: z.boolean(),
	ultimoAcesso: z.string().datetime().nullable(),
	criadoEm: z.string().datetime(),
	filiais: z.array(filialResumoSchema),
})

export const listarUsuariosClienteQuerySchema = z.object({
	busca: z.string().optional(),
	ativo: z
		.union([z.literal('true'), z.literal('false')])
		.optional()
		.transform((v) => (v === undefined ? undefined : v === 'true')),
	pagina: z.coerce.number().int().positive().default(1),
	porPagina: z.coerce.number().int().positive().max(100).default(20),
})

export const criarUsuarioClienteInputSchema = z.object({
	nome: z.string().min(2),
	email: z.string().email(),
	telefone,
	filialPrincipalId: z.string().uuid(),
	filiaisIds: z.array(z.string().uuid()).optional(),
	enviarConvite: z.boolean().default(true),
})

export const atualizarUsuarioClienteInputSchema = z.object({
	nome: z.string().min(2).optional(),
	email: z.string().email().optional(),
	telefone: telefone.optional(),
	ativo: z.boolean().optional(),
})

export const vincularFilialInputSchema = z.object({
	clienteId: z.string().uuid(),
	principal: z.boolean().default(false),
})
