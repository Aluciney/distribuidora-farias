import type { Cliente, Notificacao } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { erroSchema } from '../auth/auth.schemas'
import { NotificacoesService } from './notificacoes.service'

const notificacaoSchema = z.object({
	id: z.string(),
	clienteId: z.string(),
	usuarioClienteId: z.string().nullable(),
	faturaId: z.string().nullable(),
	regraId: z.string().nullable(),
	canal: z.enum(['EMAIL', 'WHATSAPP']).nullable(),
	titulo: z.string(),
	mensagem: z.string(),
	enviadaEm: z.string().datetime().nullable(),
	lidaEm: z.string().datetime().nullable(),
	erro: z.string().nullable(),
	criadoEm: z.string().datetime(),
	filial: z
		.object({
			id: z.string(),
			razaoSocial: z.string(),
			nomeFantasia: z.string().nullable(),
		})
		.nullable(),
})

function serializar(n: Notificacao & { cliente?: Cliente | null }) {
	return {
		id: n.id,
		clienteId: n.clienteId,
		usuarioClienteId: n.usuarioClienteId,
		faturaId: n.faturaId,
		regraId: n.regraId,
		canal: n.canal,
		titulo: n.titulo,
		mensagem: n.mensagem,
		enviadaEm: n.enviadaEm ? n.enviadaEm.toISOString() : null,
		lidaEm: n.lidaEm ? n.lidaEm.toISOString() : null,
		erro: n.erro,
		criadoEm: n.criadoEm.toISOString(),
		filial: n.cliente
			? {
					id: n.cliente.id,
					razaoSocial: n.cliente.razaoSocial,
					nomeFantasia: n.cliente.nomeFantasia,
				}
			: null,
	}
}

export async function rotasNotificacoesAdmin(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Notificações'],
				summary: 'Audit trail de notificações',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: z.object({
					clienteId: z.string().uuid().optional(),
					usuarioClienteId: z.string().uuid().optional(),
					canal: z.enum(['EMAIL', 'WHATSAPP']).optional(),
				}),
				response: { 200: z.object({ itens: z.array(notificacaoSchema) }) },
			},
			preHandler: guard,
		},
		async (req) => {
			const itens = await app.prisma.notificacao.findMany({
				where: {
					clienteId: req.query.clienteId,
					usuarioClienteId: req.query.usuarioClienteId,
					canal: req.query.canal,
				},
				include: { cliente: true },
				orderBy: { criadoEm: 'desc' },
				take: 200,
			})
			return { itens: itens.map(serializar) }
		},
	)

	a.post(
		'/disparar-regua',
		{
			schema: {
				tags: ['Notificações'],
				summary: 'Dispara régua sob demanda',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: z.object({ regraId: z.string().uuid().optional() }).default({}),
				response: {
					200: z.object({
						disparadas: z.number(),
						erros: z.number(),
						orfas: z.number(),
					}),
				},
			},
			preHandler: guard,
		},
		async (req) => {
			const service = new NotificacoesService(app.prisma)
			return service.executarRegua({ regraId: req.body?.regraId })
		},
	)
}

export async function rotasNotificacoesCliente(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerUsuarioCliente]

	a.get(
		'/',
		{
			schema: {
				tags: ['Notificações (cliente)'],
				summary: 'Lista notificações do UsuarioCliente logado (todas as filiais)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: z.object({ itens: z.array(notificacaoSchema) }) },
			},
			preHandler: guard,
		},
		async (req) => {
			const itens = await app.prisma.notificacao.findMany({
				where: { usuarioClienteId: req.sessao.sub },
				include: { cliente: true },
				orderBy: { criadoEm: 'desc' },
			})
			return { itens: itens.map(serializar) }
		},
	)

	a.post(
		'/:id/marcar-lida',
		{
			schema: {
				tags: ['Notificações (cliente)'],
				summary: 'Marca notificação como lida',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 200: notificacaoSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const result = await app.prisma.notificacao.updateMany({
				where: { id: req.params.id, usuarioClienteId: req.sessao.sub, lidaEm: null },
				data: { lidaEm: new Date() },
			})
			if (result.count === 0) {
				const ja = await app.prisma.notificacao.findFirst({
					where: { id: req.params.id, usuarioClienteId: req.sessao.sub },
					include: { cliente: true },
				})
				if (!ja) throw new Error('Notificação não encontrada.')
				return serializar(ja)
			}
			const atual = await app.prisma.notificacao.findUniqueOrThrow({
				where: { id: req.params.id },
				include: { cliente: true },
			})
			return serializar(atual)
		},
	)

	a.post(
		'/marcar-todas-lidas',
		{
			schema: {
				tags: ['Notificações (cliente)'],
				summary: 'Marca todas as notificações do UsuarioCliente como lidas',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: z.object({ atualizadas: z.number() }) },
			},
			preHandler: guard,
		},
		async (req) => {
			const r = await app.prisma.notificacao.updateMany({
				where: { usuarioClienteId: req.sessao.sub, lidaEm: null },
				data: { lidaEm: new Date() },
			})
			return { atualizadas: r.count }
		},
	)
}
