import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { adicionarDias, diasDeDiferenca, fimDoDia, inicioDoDia } from '../../shared/utils/data'

const faixaSchema = z.enum(['A_VENCER_7D', 'ATRASO_1_15', 'ATRASO_16_30', 'ATRASO_31_60', 'ATRASO_60_MAIS'])

const resumoSchema = z.object({
	totalEmAberto: z.number(),
	totalVencido: z.number(),
	qtdFaturasVencidas: z.number(),
	qtdClientesEmAtraso: z.number(),
	faixas: z.array(z.object({ faixa: faixaSchema, valor: z.number(), quantidade: z.number() })),
})

const clienteEmAtrasoSchema = z.object({
	clienteId: z.string(),
	razaoSocial: z.string(),
	cnpj: z.string(),
	totalEmAberto: z.number(),
	totalVencido: z.number(),
	qtdFaturas: z.number(),
	maiorAtrasoDias: z.number(),
})

type Faixa = z.infer<typeof faixaSchema>

function classificar(vencimento: Date, hoje: Date): Faixa {
	const dias = diasDeDiferenca(inicioDoDia(hoje), inicioDoDia(vencimento))
	if (dias >= 0 && dias <= 7) return 'A_VENCER_7D'
	if (dias < 0 && dias >= -15) return 'ATRASO_1_15'
	if (dias < -15 && dias >= -30) return 'ATRASO_16_30'
	if (dias < -30 && dias >= -60) return 'ATRASO_31_60'
	return 'ATRASO_60_MAIS'
}

export async function rotasInadimplencia(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/resumo',
		{
			schema: {
				tags: ['Inadimplência'],
				summary: 'Resumo + faixas de aging',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: resumoSchema },
			},
			preHandler: guard,
		},
		async () => {
			const hoje = new Date()
			const limiteFuturo = adicionarDias(fimDoDia(hoje), 7)
			const faturas = await app.prisma.fatura.findMany({
				where: {
					status: { in: ['PENDENTE', 'VENCIDO'] },
					dataVencimento: { lte: limiteFuturo },
				},
				select: { valor: true, status: true, clienteId: true, dataVencimento: true },
			})

			const totalEmAberto = faturas.reduce((s, f) => s + f.valor, 0)
			const vencidas = faturas.filter((f) => f.status === 'VENCIDO' || f.dataVencimento < inicioDoDia(hoje))
			const totalVencido = vencidas.reduce((s, f) => s + f.valor, 0)
			const qtdFaturasVencidas = vencidas.length
			const qtdClientesEmAtraso = new Set(vencidas.map((f) => f.clienteId)).size

			const acumulado = new Map<Faixa, { valor: number; quantidade: number }>()
			for (const f of faturas) {
				const faixa = classificar(f.dataVencimento, hoje)
				const atual = acumulado.get(faixa) ?? { valor: 0, quantidade: 0 }
				atual.valor += f.valor
				atual.quantidade += 1
				acumulado.set(faixa, atual)
			}

			const faixas: { faixa: Faixa; valor: number; quantidade: number }[] = (
				['A_VENCER_7D', 'ATRASO_1_15', 'ATRASO_16_30', 'ATRASO_31_60', 'ATRASO_60_MAIS'] as Faixa[]
			).map((faixa) => ({ faixa, ...(acumulado.get(faixa) ?? { valor: 0, quantidade: 0 }) }))

			return { totalEmAberto, totalVencido, qtdFaturasVencidas, qtdClientesEmAtraso, faixas }
		},
	)

	a.get(
		'/clientes',
		{
			schema: {
				tags: ['Inadimplência'],
				summary: 'Lista clientes em atraso (agrupado)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: z.object({ itens: z.array(clienteEmAtrasoSchema) }) },
			},
			preHandler: guard,
		},
		async () => {
			const hoje = inicioDoDia(new Date())
			const faturas = await app.prisma.fatura.findMany({
				where: { status: { in: ['PENDENTE', 'VENCIDO'] } },
				include: { cliente: { select: { id: true, razaoSocial: true, cnpj: true } } },
			})

			const map = new Map<
				string,
				{
					clienteId: string
					razaoSocial: string
					cnpj: string
					totalEmAberto: number
					totalVencido: number
					qtdFaturas: number
					maiorAtrasoDias: number
				}
			>()
			for (const f of faturas) {
				const c = f.cliente
				const item =
					map.get(c.id) ??
					({
						clienteId: c.id,
						razaoSocial: c.razaoSocial,
						cnpj: c.cnpj,
						totalEmAberto: 0,
						totalVencido: 0,
						qtdFaturas: 0,
						maiorAtrasoDias: 0,
					} as const)
				const next = { ...item, qtdFaturas: item.qtdFaturas + 1, totalEmAberto: item.totalEmAberto + f.valor }
				if (f.dataVencimento < hoje) {
					next.totalVencido += f.valor
					const dias = diasDeDiferenca(hoje, inicioDoDia(f.dataVencimento))
					if (dias > next.maiorAtrasoDias) next.maiorAtrasoDias = dias
				}
				map.set(c.id, next)
			}
			const itens = Array.from(map.values())
				.filter((c) => c.totalVencido > 0)
				.sort((a, b) => b.totalVencido - a.totalVencido)
			return { itens }
		},
	)
}
