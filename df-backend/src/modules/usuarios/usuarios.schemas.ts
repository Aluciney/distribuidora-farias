import { z } from 'zod'

export const perfilSchema = z.enum(['ADMIN', 'FINANCEIRO'])

export const usuarioSchema = z.object({
	id: z.string(),
	nome: z.string(),
	email: z.string(),
	perfil: perfilSchema,
	ativo: z.boolean(),
	ultimoAcesso: z.string().datetime().nullable(),
	criadoEm: z.string().datetime(),
	atualizadoEm: z.string().datetime(),
})

export const listarUsuariosQuerySchema = z.object({
	busca: z.string().optional(),
	perfil: perfilSchema.optional(),
	ativo: z
		.enum(['true', 'false'])
		.optional()
		.transform((v) => (v === undefined ? undefined : v === 'true')),
})

export const criarUsuarioInputSchema = z.object({
	nome: z.string().min(2),
	email: z.string().email(),
	perfil: perfilSchema,
	senha: z.string().min(4).optional(),
	ativo: z.boolean().default(true),
})

export const atualizarUsuarioInputSchema = z.object({
	nome: z.string().min(2).optional(),
	email: z.string().email().optional(),
	perfil: perfilSchema.optional(),
	ativo: z.boolean().optional(),
})

export const toggleAtivoInputSchema = z.object({
	ativo: z.boolean(),
})
