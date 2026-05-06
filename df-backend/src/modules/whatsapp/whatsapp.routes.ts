import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { whatsappService } from './whatsapp.service'

const statusSchema = z.object({
	status: z.enum(['desconectado', 'aguardando_qr', 'conectando', 'conectado']),
	qrCodeDataUrl: z.string().nullable(),
	usuario: z
		.object({
			id: z.string(),
			nome: z.string().optional(),
		})
		.nullable(),
	ultimoErro: z.string().nullable(),
})

const enviarMensagemSchema = z.object({
	destinatario: z.string().min(8),
	mensagem: z.string().min(1),
})

export async function rotasWhatsapp(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/status',
		{
			schema: {
				tags: ['WhatsApp'],
				summary: 'Estado atual da conexão WhatsApp (inclui QR code se aguardando)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: statusSchema },
			},
			preHandler: guard,
		},
		async () => whatsappService.getInfo(),
	)

	a.post(
		'/conectar',
		{
			schema: {
				tags: ['WhatsApp'],
				summary: 'Inicia/retoma a conexão (gera novo QR se necessário)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 202: statusSchema },
			},
			preHandler: guard,
		},
		async (_req, reply) => {
			whatsappService.iniciar().catch((err) => app.log.error({ err }, 'Falha ao iniciar WhatsApp'))
			return reply.status(202).send(whatsappService.getInfo())
		},
	)

	a.post(
		'/desconectar',
		{
			schema: {
				tags: ['WhatsApp'],
				summary: 'Faz logout e descarta a sessão atual',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: statusSchema },
			},
			preHandler: guard,
		},
		async () => {
			await whatsappService.desconectar()
			return whatsappService.getInfo()
		},
	)

	a.post(
		'/enviar-teste',
		{
			schema: {
				tags: ['WhatsApp'],
				summary: 'Envia uma mensagem manual (para testar a conexão)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: enviarMensagemSchema,
				response: {
					200: z.object({ ok: z.literal(true), enviadoEm: z.string().datetime() }),
				},
			},
			preHandler: guard,
		},
		async (req) => {
			await whatsappService.enviarTexto(req.body.destinatario, req.body.mensagem)
			return { ok: true as const, enviadoEm: new Date().toISOString() }
		},
	)
}
