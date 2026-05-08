import { z } from 'zod'

export const loginAdminInputSchema = z.object({
	email: z.string().email(),
	senha: z.string().min(1),
})

export const loginUsuarioClienteInputSchema = z.object({
	email: z.string().email(),
	senha: z.string().min(1),
})

export const tipoEntidadeSchema = z.enum(['ADMIN', 'USUARIO_CLIENTE'])

export const alterarSenhaInputSchema = z.object({
	senhaAtual: z.string().min(1),
	senhaNova: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

export const esqueciSenhaInputSchema = z.object({
	tipo: tipoEntidadeSchema,
	email: z.string().email(),
})

export const redefinirSenhaInputSchema = z.object({
	tipo: tipoEntidadeSchema,
	email: z.string().email(),
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

/// Resumo público do UsuarioCliente (holding) — o que o portal expõe na sessão.
/// Inclui um resumo das filiais acessíveis para que o frontend possa montar
/// o seletor de filial logo após o login.
export const usuarioClientePublicoSchema = z.object({
	id: z.string(),
	nome: z.string(),
	email: z.string(),
	telefone: z.string(),
	ativo: z.boolean(),
	ultimoAcesso: z.string().datetime().nullable(),
	filiais: z.array(
		z.object({
			id: z.string(),
			cnpj: z.string(),
			razaoSocial: z.string(),
			nomeFantasia: z.string().nullable(),
			status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']),
			principal: z.boolean(),
		}),
	),
})

export const respostaLoginAdminSchema = z.object({
	usuario: usuarioPublicoSchema,
	token: z.string(),
})

export const respostaLoginUsuarioClienteSchema = z.object({
	usuarioCliente: usuarioClientePublicoSchema,
	token: z.string(),
})

export const respostaEuSchema = z.object({
	tipo: tipoEntidadeSchema,
	usuario: usuarioPublicoSchema.nullable(),
	usuarioCliente: usuarioClientePublicoSchema.nullable(),
})

export const erroSchema = z.object({
	erro: z.string(),
	mensagem: z.string(),
	detalhes: z.unknown().optional(),
})
