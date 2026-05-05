import { fastifyCookie } from '@fastify/cookie'
import { fastifyJwt } from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { env } from '../env'
import { NaoAutorizado, Proibido } from '../shared/erros'
import type { SessaoToken } from '../shared/tipos'

export const COOKIE_SESSAO = 'df_session'

declare module 'fastify' {
	interface FastifyInstance {
		requerAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
		requerCliente: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
		requerPerfilAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
		assinarSessao: (sessao: SessaoToken) => string
		setarCookieSessao: (reply: FastifyReply, token: string) => void
		limparCookieSessao: (reply: FastifyReply) => void
	}
	interface FastifyRequest {
		sessao: SessaoToken
	}
}

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: SessaoToken
		user: SessaoToken
	}
}

export const authPlugin = fp(async (app) => {
	await app.register(fastifyCookie, { secret: env.COOKIE_SECRET })

	await app.register(fastifyJwt, {
		secret: env.JWT_SECRET,
		sign: { expiresIn: env.JWT_EXPIRES_IN },
		cookie: { cookieName: COOKIE_SESSAO, signed: true },
	})

	app.decorateRequest('sessao', null as unknown as SessaoToken)

	app.decorate('assinarSessao', (sessao: SessaoToken) => app.jwt.sign(sessao))

	app.decorate('setarCookieSessao', (reply: FastifyReply, token: string) => {
		reply.setCookie(COOKIE_SESSAO, token, {
			httpOnly: true,
			secure: env.COOKIE_SECURE,
			sameSite: 'lax',
			signed: true,
			path: '/',
		})
	})

	app.decorate('limparCookieSessao', (reply: FastifyReply) => {
		reply.clearCookie(COOKIE_SESSAO, { path: '/' })
	})

	const verificar = async (req: FastifyRequest) => {
		try {
			const decoded = await req.jwtVerify<SessaoToken>()
			req.sessao = decoded
		} catch {
			throw new NaoAutorizado('TOKEN_INVALIDO', 'Sessão inválida ou expirada.')
		}
	}

	app.decorate('requerAdmin', async (req: FastifyRequest) => {
		await verificar(req)
		if (req.sessao.tipo !== 'ADMIN') throw new Proibido()
	})

	app.decorate('requerCliente', async (req: FastifyRequest) => {
		await verificar(req)
		if (req.sessao.tipo !== 'CLIENTE') throw new Proibido()
	})

	app.decorate('requerPerfilAdmin', async (req: FastifyRequest) => {
		await verificar(req)
		if (req.sessao.tipo !== 'ADMIN' || req.sessao.perfil !== 'ADMIN') {
			throw new Proibido('PERFIL_INSUFICIENTE', 'Apenas perfil ADMIN pode executar esta operação.')
		}
	})
})
