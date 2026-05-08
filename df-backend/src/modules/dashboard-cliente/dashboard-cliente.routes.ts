import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { Proibido } from '../../shared/erros'
import { obterClientesAcessiveis } from '../../shared/tenancy'

const proximaFaturaSchema = z.object({
	id: z.string(),
	numero: z.string(),
	valor: z.number(),
	dataVencimento: z.string().datetime(),
	status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO', 'ESTORNADO']),
	filial: z.object({
		id: z.string(),
		razaoSocial: z.string(),
		nomeFantasia: z.string().nullable(),
	}),
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
	const guard = [app.requerUsuarioCliente]

	a.get(
		'/',
		{
			schema: {
				tags: ['Dashboard cliente'],
				summary: 'Resumo financeiro consolidado das filiais da holding logada',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: z.object({
					/// Quando informado, escopa o resumo a uma única filial.
					filialId: z.string().uuid().optional(),
				}),
				response: { 200: dashboardSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const usuarioClienteId = req.sessao.sub
			const acessiveis = await obterClientesAcessiveis(app.prisma, usuarioClienteId)
			const filtroClientes = req.query.filialId
				? (() => {
						if (!acessiveis.includes(req.query.filialId)) {
							throw new Proibido('FILIAL_INACESSIVEL', 'Filial não pertence à sua conta.')
						}
						return [req.query.filialId]
					})()
				: acessiveis

			if (filtroClientes.length === 0) {
				return { totalGasto: 0, totalEmAberto: 0, totalVencido: 0, qtdFaturasEmAberto: 0, proximas: [] }
			}

			const [pagas, abertas] = await Promise.all([
				app.prisma.fatura.findMany({
					where: { clienteId: { in: filtroClientes }, status: 'PAGO' },
					select: { valor: true },
				}),
				app.prisma.fatura.findMany({
					where: { clienteId: { in: filtroClientes }, status: { in: ['PENDENTE', 'VENCIDO'] } },
					orderBy: { dataVencimento: 'asc' },
					include: { cliente: { select: { id: true, razaoSocial: true, nomeFantasia: true } } },
				}),
			])
			const hoje = new Date()
			const totalGasto = pagas.reduce((s, f) => s + f.valor, 0)
			const totalEmAberto = abertas.reduce((s, f) => s + f.valor, 0)
			const totalVencido = abertas
				.filter((f) => f.dataVencimento < hoje)
				.reduce((s, f) => s + f.valor, 0)
			const proximas = abertas.slice(0, 5).map((f) => ({
				id: f.id,
				numero: f.numero,
				valor: f.valor,
				dataVencimento: f.dataVencimento.toISOString(),
				status: f.status,
				filial: {
					id: f.cliente.id,
					razaoSocial: f.cliente.razaoSocial,
					nomeFantasia: f.cliente.nomeFantasia,
				},
			}))
			return {
				totalGasto,
				totalEmAberto,
				totalVencido,
				qtdFaturasEmAberto: abertas.length,
				proximas,
			}
		},
	)
}
