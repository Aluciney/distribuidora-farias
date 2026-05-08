import type { Cliente, UsuarioCliente, UsuarioClienteAcesso } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { NaoAutorizado } from '../../shared/erros'
import { AuthService } from './auth.service'
import {
	alterarSenhaInputSchema,
	erroSchema,
	esqueciSenhaInputSchema,
	loginAdminInputSchema,
	loginUsuarioClienteInputSchema,
	redefinirSenhaInputSchema,
	respostaEuSchema,
	respostaLoginAdminSchema,
	respostaLoginUsuarioClienteSchema,
	usuarioClientePublicoSchema,
	usuarioPublicoSchema,
} from './auth.schemas'

type UsuarioClienteComFiliais = UsuarioCliente & {
	acessos: (UsuarioClienteAcesso & { cliente: Cliente })[]
}

export async function rotasAuth(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const service = new AuthService(app.prisma)

	a.post(
		'/login/admin',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Login de usuário admin',
				body: loginAdminInputSchema,
				response: { 200: respostaLoginAdminSchema, 401: erroSchema, 403: erroSchema },
			},
		},
		async (req, reply) => {
			const usuario = await service.loginAdmin(req.body.email, req.body.senha)
			const token = app.assinarSessao({ sub: usuario.id, tipo: 'ADMIN', perfil: usuario.perfil })
			app.setarCookieSessao(reply, token)
			return {
				usuario: serializarUsuario(usuario),
				token,
			}
		},
	)

	a.post(
		'/login/cliente',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Login do portal do cliente (UsuarioCliente — holding/matriz)',
				body: loginUsuarioClienteInputSchema,
				response: { 200: respostaLoginUsuarioClienteSchema, 401: erroSchema, 403: erroSchema },
			},
		},
		async (req, reply) => {
			await service.loginUsuarioCliente(req.body.email, req.body.senha)
			const usuarioCliente = await carregarUsuarioClienteComFiliais(app, req.body.email)
			if (!usuarioCliente) throw new NaoAutorizado()
			const token = app.assinarSessao({ sub: usuarioCliente.id, tipo: 'USUARIO_CLIENTE' })
			app.setarCookieSessao(reply, token)
			return {
				usuarioCliente: serializarUsuarioCliente(usuarioCliente),
				token,
			}
		},
	)

	a.post(
		'/logout',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Encerra a sessão (limpa cookie)',
				response: { 204: z.null() },
			},
		},
		async (_req, reply) => {
			app.limparCookieSessao(reply)
			return reply.status(204).send(null)
		},
	)

	a.get(
		'/eu',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Retorna o admin ou o usuário cliente da sessão',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: respostaEuSchema, 401: erroSchema },
			},
		},
		async (req) => {
			try {
				const decoded = await req.jwtVerify<{ sub: string; tipo: 'ADMIN' | 'USUARIO_CLIENTE' }>()
				if (decoded.tipo === 'ADMIN') {
					const usuario = await service.obterUsuario(decoded.sub)
					if (!usuario) throw new NaoAutorizado()
					return {
						tipo: 'ADMIN' as const,
						usuario: serializarUsuario(usuario),
						usuarioCliente: null,
					}
				}
				const usuarioCliente = await carregarUsuarioClientePorId(app, decoded.sub)
				if (!usuarioCliente) throw new NaoAutorizado()
				return {
					tipo: 'USUARIO_CLIENTE' as const,
					usuario: null,
					usuarioCliente: serializarUsuarioCliente(usuarioCliente),
				}
			} catch {
				throw new NaoAutorizado()
			}
		},
	)

	// -------------------------------------------------------------------------
	// Alterar senha (autenticado, admin ou usuário cliente)
	// -------------------------------------------------------------------------
	a.post(
		'/alterar-senha',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Altera a própria senha',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: alterarSenhaInputSchema,
				response: { 204: z.null(), 401: erroSchema, 422: erroSchema },
			},
			preHandler: [app.requerSessao],
		},
		async (req, reply) => {
			await service.alterarSenha({
				tipo: req.sessao.tipo,
				entidadeId: req.sessao.sub,
				senhaAtual: req.body.senhaAtual,
				senhaNova: req.body.senhaNova,
			})
			return reply.status(204).send(null)
		},
	)

	// -------------------------------------------------------------------------
	// Recuperação de senha
	// -------------------------------------------------------------------------
	a.post(
		'/esqueci-senha',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Envia código de recuperação para o email cadastrado',
				body: esqueciSenhaInputSchema,
				response: {
					200: z.object({
						/** Email mascarado (`ma***@dominio.com`) ou null se entidade não existir. */
						destinatario: z.string().nullable(),
					}),
					422: erroSchema,
				},
			},
		},
		async (req) => {
			return service.solicitarRecuperacaoSenha({
				tipo: req.body.tipo,
				email: req.body.email,
			})
		},
	)

	a.post(
		'/redefinir-senha',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Redefine senha usando o código recebido por email',
				body: redefinirSenhaInputSchema,
				response: { 204: z.null(), 422: erroSchema },
			},
		},
		async (req, reply) => {
			await service.redefinirSenha({
				tipo: req.body.tipo,
				email: req.body.email,
				codigo: req.body.codigo,
				senhaNova: req.body.senhaNova,
			})
			return reply.status(204).send(null)
		},
	)
}

async function carregarUsuarioClienteComFiliais(
	app: FastifyInstance,
	email: string,
): Promise<UsuarioClienteComFiliais | null> {
	return app.prisma.usuarioCliente.findUnique({
		where: { email: email.trim().toLowerCase() },
		include: { acessos: { include: { cliente: true } } },
	})
}

async function carregarUsuarioClientePorId(
	app: FastifyInstance,
	id: string,
): Promise<UsuarioClienteComFiliais | null> {
	return app.prisma.usuarioCliente.findUnique({
		where: { id },
		include: { acessos: { include: { cliente: true } } },
	})
}

function serializarUsuario(u: {
	id: string
	nome: string
	email: string
	perfil: 'ADMIN' | 'FINANCEIRO'
	ativo: boolean
	ultimoAcesso: Date | null
	criadoEm: Date
}) {
	return {
		id: u.id,
		nome: u.nome,
		email: u.email,
		perfil: u.perfil,
		ativo: u.ativo,
		ultimoAcesso: u.ultimoAcesso ? u.ultimoAcesso.toISOString() : null,
		criadoEm: u.criadoEm.toISOString(),
	}
}

function serializarUsuarioCliente(u: UsuarioClienteComFiliais) {
	return {
		id: u.id,
		nome: u.nome,
		email: u.email,
		telefone: u.telefone,
		ativo: u.ativo,
		ultimoAcesso: u.ultimoAcesso ? u.ultimoAcesso.toISOString() : null,
		filiais: u.acessos.map((a) => ({
			id: a.cliente.id,
			cnpj: a.cliente.cnpj,
			razaoSocial: a.cliente.razaoSocial,
			nomeFantasia: a.cliente.nomeFantasia,
			status: a.cliente.status,
			principal: a.principal,
		})),
	}
}

// Reexport para uso em outros módulos
export { usuarioPublicoSchema, usuarioClientePublicoSchema, erroSchema }
