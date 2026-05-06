import type { Produto } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

const produtoSchema = z.object({
	id: z.string(),
	sku: z.string(),
	descricao: z.string(),
	unidade: z.string(),
	preco: z.number(),
	estoque: z.number(),
	ativo: z.boolean(),
	criadoEm: z.string().datetime(),
	atualizadoEm: z.string().datetime(),
})

function serializar(p: Produto) {
	return {
		id: p.id,
		sku: p.sku,
		descricao: p.descricao,
		unidade: p.unidade,
		preco: p.preco,
		estoque: p.estoque,
		ativo: p.ativo,
		criadoEm: p.criadoEm.toISOString(),
		atualizadoEm: p.atualizadoEm.toISOString(),
	}
}

export async function rotasProdutos(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Produtos'],
				summary: 'Lista produtos paginados (read-only do ERP)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: z.object({
					busca: z.string().optional(),
					ativo: z
						.enum(['true', 'false'])
						.optional()
						.transform((v) => (v === undefined ? undefined : v === 'true')),
					pagina: z.coerce.number().int().positive().default(1),
					porPagina: z.coerce.number().int().positive().max(100).default(10),
				}),
				response: {
					200: z.object({
						itens: z.array(produtoSchema),
						total: z.number(),
						pagina: z.number(),
						porPagina: z.number(),
					}),
				},
			},
			preHandler: guard,
		},
		async (req) => {
			const where = {
				ativo: req.query.ativo,
				...(req.query.busca
					? {
							OR: [
								{ sku: { contains: req.query.busca, mode: 'insensitive' as const } },
								{ descricao: { contains: req.query.busca, mode: 'insensitive' as const } },
							],
						}
					: {}),
			}
			const [itens, total] = await Promise.all([
				app.prisma.produto.findMany({
					where,
					orderBy: { sku: 'asc' },
					skip: (req.query.pagina - 1) * req.query.porPagina,
					take: req.query.porPagina,
				}),
				app.prisma.produto.count({ where }),
			])
			return {
				itens: itens.map(serializar),
				total,
				pagina: req.query.pagina,
				porPagina: req.query.porPagina,
			}
		},
	)
}
