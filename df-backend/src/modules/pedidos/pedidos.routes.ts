import type { ItemPedido, Pedido } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { NaoEncontrado } from '../../shared/erros'
import { erroSchema } from '../auth/auth.schemas'

const itemPedidoSchema = z.object({
	id: z.string(),
	produtoId: z.string().nullable(),
	descricao: z.string(),
	quantidade: z.number(),
	valorUnitario: z.number(),
	valorTotal: z.number(),
})

const clienteResumoSchema = z.object({
	id: z.string(),
	cnpj: z.string(),
	razaoSocial: z.string(),
})

const pedidoBaseSchema = z.object({
	id: z.string(),
	numero: z.string(),
	clienteId: z.string(),
	cliente: clienteResumoSchema.nullable(),
	valorTotal: z.number(),
	status: z.enum(['ABERTO', 'FATURADO', 'ENTREGUE', 'CANCELADO']),
	emitidoEm: z.string().datetime(),
	observacoes: z.string().nullable(),
	origem: z.enum(['ERP', 'MANUAL']),
	criadoEm: z.string().datetime(),
})

const pedidoComItensSchema = pedidoBaseSchema.extend({
	itens: z.array(itemPedidoSchema),
})

function serializarItem(i: ItemPedido) {
	return {
		id: i.id,
		produtoId: i.produtoId,
		descricao: i.descricao,
		quantidade: i.quantidade,
		valorUnitario: i.valorUnitario,
		valorTotal: i.valorTotal,
	}
}

function serializarPedido(p: Pedido & { cliente?: { id: string; cnpj: string; razaoSocial: string } | null }) {
	return {
		id: p.id,
		numero: p.numero,
		clienteId: p.clienteId,
		cliente: p.cliente ? { id: p.cliente.id, cnpj: p.cliente.cnpj, razaoSocial: p.cliente.razaoSocial } : null,
		valorTotal: p.valorTotal,
		status: p.status,
		emitidoEm: p.emitidoEm.toISOString(),
		observacoes: p.observacoes,
		origem: p.origem,
		criadoEm: p.criadoEm.toISOString(),
	}
}

export async function rotasPedidos(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Pedidos'],
				summary: 'Lista pedidos',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: z.object({
					clienteId: z.string().uuid().optional(),
					status: z.enum(['ABERTO', 'FATURADO', 'ENTREGUE', 'CANCELADO']).optional(),
					busca: z.string().optional(),
				}),
				response: { 200: z.object({ itens: z.array(pedidoBaseSchema) }) },
			},
			preHandler: guard,
		},
		async (req) => {
			const itens = await app.prisma.pedido.findMany({
				where: {
					clienteId: req.query.clienteId,
					status: req.query.status,
					...(req.query.busca ? { numero: { contains: req.query.busca, mode: 'insensitive' } } : {}),
				},
				include: { cliente: { select: { id: true, cnpj: true, razaoSocial: true } } },
				orderBy: { emitidoEm: 'desc' },
			})
			return { itens: itens.map(serializarPedido) }
		},
	)

	a.get(
		'/faturaveis',
		{
			schema: {
				tags: ['Pedidos'],
				summary: 'Lista pedidos faturáveis (ABERTO ou FATURADO)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: z.object({ itens: z.array(pedidoBaseSchema) }) },
			},
			preHandler: guard,
		},
		async () => {
			const itens = await app.prisma.pedido.findMany({
				where: { status: { in: ['ABERTO', 'FATURADO'] } },
				include: { cliente: { select: { id: true, cnpj: true, razaoSocial: true } } },
				orderBy: { emitidoEm: 'desc' },
			})
			return { itens: itens.map(serializarPedido) }
		},
	)

	a.get(
		'/:id',
		{
			schema: {
				tags: ['Pedidos'],
				summary: 'Obtém pedido com itens',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 200: pedidoComItensSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const pedido = await app.prisma.pedido.findUnique({
				where: { id: req.params.id },
				include: {
					itens: true,
					cliente: { select: { id: true, cnpj: true, razaoSocial: true } },
				},
			})
			if (!pedido) throw new NaoEncontrado('Pedido', req.params.id)
			return { ...serializarPedido(pedido), itens: pedido.itens.map(serializarItem) }
		},
	)
}
