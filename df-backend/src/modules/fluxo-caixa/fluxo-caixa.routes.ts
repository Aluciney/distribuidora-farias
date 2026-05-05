import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { parseIsoMes } from '../../shared/utils/data'

const movimentacaoDiaSchema = z.object({
	dia: z.string(),
	totalRecebido: z.number(),
	totalPendente: z.number(),
	totalVencido: z.number(),
})

const resumoMetodoSchema = z.object({
	metodo: z.enum(['BOLETO', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO']),
	valor: z.number(),
	quantidade: z.number(),
})

const ultimaMovSchema = z.object({
	id: z.string(),
	tipo: z.enum(['RECEBIMENTO', 'PENDENCIA']),
	clienteRazaoSocial: z.string(),
	faturaNumero: z.string(),
	valor: z.number(),
	data: z.string().datetime(),
	metodo: z.enum(['BOLETO', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO']).nullable(),
})

const respostaSchema = z.object({
	mes: z.string(),
	totalRecebido: z.number(),
	totalPendente: z.number(),
	totalVencido: z.number(),
	ticketMedio: z.number(),
	movimentacoesDiarias: z.array(movimentacaoDiaSchema),
	resumoPorMetodo: z.array(resumoMetodoSchema),
	ultimasMovimentacoes: z.array(ultimaMovSchema),
	variacaoMesAnterior: z.number(),
})

export async function rotasFluxoCaixa(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Fluxo de Caixa'],
				summary: 'Movimentações diárias e KPIs do mês',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: z.object({ mes: z.string().regex(/^\d{4}-\d{2}$/) }),
				response: { 200: respostaSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const referencia = parseIsoMes(req.query.mes)
			const inicio = startOfMonth(referencia)
			const fim = endOfMonth(referencia)
			const inicioAnterior = startOfMonth(subMonths(referencia, 1))
			const fimAnterior = endOfMonth(subMonths(referencia, 1))

			const [recebidasMes, recebidasMesAnterior, pendentes] = await Promise.all([
				app.prisma.fatura.findMany({
					where: { dataPagamento: { gte: inicio, lte: fim }, status: 'PAGO' },
					include: { cliente: { select: { razaoSocial: true } } },
				}),
				app.prisma.fatura.findMany({
					where: { dataPagamento: { gte: inicioAnterior, lte: fimAnterior }, status: 'PAGO' },
					select: { valor: true },
				}),
				app.prisma.fatura.findMany({
					where: {
						status: { in: ['PENDENTE', 'VENCIDO'] },
						dataVencimento: { gte: inicio, lte: fim },
					},
					include: { cliente: { select: { razaoSocial: true } } },
				}),
			])

			const totalRecebido = recebidasMes.reduce((s, f) => s + f.valor, 0)
			const totalAnterior = recebidasMesAnterior.reduce((s, f) => s + f.valor, 0)
			const totalPendente = pendentes.filter((f) => f.dataVencimento >= new Date()).reduce((s, f) => s + f.valor, 0)
			const totalVencido = pendentes.filter((f) => f.dataVencimento < new Date()).reduce((s, f) => s + f.valor, 0)
			const ticketMedio = recebidasMes.length === 0 ? 0 : Math.round(totalRecebido / recebidasMes.length)
			const variacaoMesAnterior = totalAnterior === 0 ? 0 : ((totalRecebido - totalAnterior) / totalAnterior) * 100

			const diasMap = new Map<string, { totalRecebido: number; totalPendente: number; totalVencido: number }>()
			for (const f of recebidasMes) {
				if (!f.dataPagamento) continue
				const k = format(f.dataPagamento, 'yyyy-MM-dd')
				const cur = diasMap.get(k) ?? { totalRecebido: 0, totalPendente: 0, totalVencido: 0 }
				cur.totalRecebido += f.valor
				diasMap.set(k, cur)
			}
			for (const f of pendentes) {
				const k = format(f.dataVencimento, 'yyyy-MM-dd')
				const cur = diasMap.get(k) ?? { totalRecebido: 0, totalPendente: 0, totalVencido: 0 }
				if (f.dataVencimento < new Date()) cur.totalVencido += f.valor
				else cur.totalPendente += f.valor
				diasMap.set(k, cur)
			}
			const movimentacoesDiarias = Array.from(diasMap.entries())
				.sort((a, b) => a[0].localeCompare(b[0]))
				.map(([dia, v]) => ({ dia, ...v }))

			const metodoMap = new Map<'BOLETO' | 'PIX' | 'CARTAO_CREDITO' | 'DINHEIRO', { valor: number; quantidade: number }>()
			for (const f of recebidasMes) {
				if (!f.pagamentoMetodo) continue
				const cur = metodoMap.get(f.pagamentoMetodo) ?? { valor: 0, quantidade: 0 }
				cur.valor += f.valor
				cur.quantidade += 1
				metodoMap.set(f.pagamentoMetodo, cur)
			}
			const resumoPorMetodo = Array.from(metodoMap.entries()).map(([metodo, v]) => ({ metodo, ...v }))

			const ultimasMovimentacoes = [
				...recebidasMes.map((f) => ({
					id: f.id,
					tipo: 'RECEBIMENTO' as const,
					clienteRazaoSocial: f.cliente.razaoSocial,
					faturaNumero: f.numero,
					valor: f.valor,
					data: (f.dataPagamento ?? f.dataVencimento).toISOString(),
					metodo: f.pagamentoMetodo ?? null,
				})),
				...pendentes.map((f) => ({
					id: f.id,
					tipo: 'PENDENCIA' as const,
					clienteRazaoSocial: f.cliente.razaoSocial,
					faturaNumero: f.numero,
					valor: f.valor,
					data: f.dataVencimento.toISOString(),
					metodo: null,
				})),
			]
				.sort((a, b) => (a.data > b.data ? -1 : 1))
				.slice(0, 10)

			return {
				mes: req.query.mes,
				totalRecebido,
				totalPendente,
				totalVencido,
				ticketMedio,
				movimentacoesDiarias,
				resumoPorMetodo,
				ultimasMovimentacoes,
				variacaoMesAnterior,
			}
		},
	)
}
