import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { NaoAutorizado } from '../../shared/erros'
import { AuthService } from './auth.service'
import {
	clientePublicoResumoSchema,
	definirSenhaInputSchema,
	erroSchema,
	loginAdminInputSchema,
	loginClienteInputSchema,
	respostaEuSchema,
	respostaLoginAdminSchema,
	respostaLoginClienteSchema,
	usuarioPublicoSchema,
} from './auth.schemas'

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
				summary: 'Login de cliente (portal)',
				body: loginClienteInputSchema,
				response: { 200: respostaLoginClienteSchema, 401: erroSchema, 403: erroSchema },
			},
		},
		async (req, reply) => {
			const cliente = await service.loginCliente(req.body.cnpj, req.body.senha)
			const token = app.assinarSessao({ sub: cliente.id, tipo: 'CLIENTE' })
			app.setarCookieSessao(reply, token)
			return {
				cliente: {
					id: cliente.id,
					cnpj: cliente.cnpj,
					razaoSocial: cliente.razaoSocial,
					nomeFantasia: cliente.nomeFantasia,
					email: cliente.email,
					status: cliente.status,
				},
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
				summary: 'Retorna usuário ou cliente da sessão',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: respostaEuSchema, 401: erroSchema },
			},
		},
		async (req) => {
			try {
				const decoded = await req.jwtVerify<{ sub: string; tipo: 'ADMIN' | 'CLIENTE' }>()
				if (decoded.tipo === 'ADMIN') {
					const usuario = await service.obterUsuario(decoded.sub)
					if (!usuario) throw new NaoAutorizado()
					return { tipo: 'ADMIN' as const, usuario: serializarUsuario(usuario), cliente: null }
				}
				const cliente = await service.obterCliente(decoded.sub)
				if (!cliente) throw new NaoAutorizado()
				return {
					tipo: 'CLIENTE' as const,
					usuario: null,
					cliente: {
						id: cliente.id,
						cnpj: cliente.cnpj,
						razaoSocial: cliente.razaoSocial,
						nomeFantasia: cliente.nomeFantasia,
						email: cliente.email,
						status: cliente.status,
					},
				}
			} catch {
				throw new NaoAutorizado()
			}
		},
	)

	a.post(
		'/cliente/definir-senha',
		{
			schema: {
				tags: ['Auth'],
				summary: 'Define senha do cliente no primeiro acesso',
				body: definirSenhaInputSchema,
				response: { 204: z.null(), 422: erroSchema },
			},
		},
		async (req, reply) => {
			await service.definirSenhaCliente(req.body.cnpj, req.body.senha)
			return reply.status(204).send(null)
		},
	)
}

function serializarUsuario(u: { id: string; nome: string; email: string; perfil: 'ADMIN' | 'FINANCEIRO'; ativo: boolean; ultimoAcesso: Date | null; criadoEm: Date }) {
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

// Reexport para uso em outros módulos
export { usuarioPublicoSchema, clientePublicoResumoSchema, erroSchema }
