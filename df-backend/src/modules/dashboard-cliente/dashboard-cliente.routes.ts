import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

const proximaFaturaSchema = z.object({
	id: z.string(),
	numero: z.string(),
	valor: z.number(),
	dataVencimento: z.string().datetime(),
	status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO', 'ESTORNADO']),
})

const dashboardSchema = z.object({
	totalGasto: z.number(),
	totalEmAberto: z.number(),
	totalVencido: z.number(),
	qtdFaturasEmAberto: z.number(),
	proximas: z.array(proximaFaturaSchema),
})

export async function rotasDashboardCliente(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerCliente]

	a.get(
		'/',
		{
			schema: {
				tags: ['Dashboard cliente'],
				summary: 'Resumo financeiro do cliente logado',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: dashboardSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const clienteId = req.sessao.sub
			const [pagas, abertas] = await Promise.all([
				app.prisma.fatura.findMany({ where: { clienteId, status: 'PAGO' }, select: { valor: true } }),
				app.prisma.fatura.findMany({
					where: { clienteId, status: { in: ['PENDENTE', 'VENCIDO'] } },
					orderBy: { dataVencimento: 'asc' },
				}),
			])
			const hoje = new Date()
			const totalGasto = pagas.reduce((s, f) => s + f.valor, 0)
			const totalEmAberto = abertas.reduce((s, f) => s + f.valor, 0)
			const totalVencido = abertas.filter((f) => f.dataVencimento < hoje).reduce((s, f) => s + f.valor, 0)
			const proximas = abertas.slice(0, 5).map((f) => ({
				id: f.id,
				numero: f.numero,
				valor: f.valor,
				dataVencimento: f.dataVencimento.toISOString(),
				status: f.status,
			}))
			return { totalGasto, totalEmAberto, totalVencido, qtdFaturasEmAberto: abertas.length, proximas }
		},
	)
}
