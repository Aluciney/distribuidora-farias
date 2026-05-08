import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { erroSchema } from '../auth/auth.schemas'
import { PushService } from './push.service'

const registrarTokenSchema = z.object({
	token: z.string().min(10),
	plataforma: z.enum(['ios', 'android', 'web']).optional(),
})

export async function rotasPushCliente(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerUsuarioCliente]
	const service = new PushService(app.prisma, app.log)

	a.post(
		'/dispositivos',
		{
			schema: {
				tags: ['Portal do Cliente'],
				summary: 'Registra token Expo do dispositivo p/ push notifications',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: registrarTokenSchema,
				response: {
					200: z.object({ ok: z.literal(true) }),
					422: erroSchema,
				},
			},
			preHandler: guard,
		},
		async (req) => {
			await service.registrarToken({
				usuarioClienteId: req.sessao.sub,
				token: req.body.token,
				plataforma: req.body.plataforma,
			})
			return { ok: true as const }
		},
	)

	a.delete(
		'/dispositivos/:token',
		{
			schema: {
				tags: ['Portal do Cliente'],
				summary: 'Remove token Expo (logout/desinstalação)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ token: z.string() }),
				response: { 204: z.null() },
			},
			preHandler: guard,
		},
		async (req, reply) => {
			await service.removerToken(req.params.token)
			return reply.status(204).send(null)
		},
	)
}
