import type { Cliente, Fatura } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { erroSchema } from '../auth/auth.schemas'
import {
	baixaManualInputSchema,
	cancelarInputSchema,
	criarCobrancaInputSchema,
	faturaSchema,
	listarCobrancasQuerySchema,
	pagarComCartaoInputSchema,
	statusFaturaSchema,
} from './cobrancas.schemas'
import { CobrancasService } from './cobrancas.service'

export function serializarFatura(f: Fatura & { cliente?: Cliente | null }) {
	return {
		id: f.id,
		numero: f.numero,
		pedidoId: f.pedidoId,
		clienteId: f.clienteId,
		cliente: f.cliente
			? {
					id: f.cliente.id,
					cnpj: f.cliente.cnpj,
					razaoSocial: f.cliente.razaoSocial,
					nomeFantasia: f.cliente.nomeFantasia,
					email: f.cliente.email,
					telefone: f.cliente.telefone,
				}
			: null,
		valor: f.valor,
		valorPago: f.valorPago,
		status: f.status,
		dataEmissao: f.dataEmissao.toISOString(),
		dataVencimento: f.dataVencimento.toISOString(),
		dataPagamento: f.dataPagamento ? f.dataPagamento.toISOString() : null,
		observacoes: f.observacoes,
		boleto: {
			linhaDigitavel: f.boletoLinhaDigitavel,
			codigoBarras: f.boletoCodigoBarras,
			nossoNumero: f.boletoNossoNumero,
			url: f.boletoUrl,
		},
		pix: {
			copiaECola: f.pixCopiaECola,
			qrCode: f.pixQrCode,
			txid: f.pixTxid,
			expiraEm: f.pixExpiraEm ? f.pixExpiraEm.toISOString() : null,
		},
		pagamento: f.pagamentoMetodo
			? {
					metodo: f.pagamentoMetodo,
					cartao:
						f.pagamentoMetodo === 'CARTAO_CREDITO' && f.pagamentoCartaoAuthId
							? {
									bandeira: f.pagamentoCartaoBandeira ?? 'DESCONHECIDA',
									ultimosDigitos: f.pagamentoCartaoUltimosDigitos ?? '',
									parcelas: f.pagamentoCartaoParcelas ?? 1,
									authorizationId: f.pagamentoCartaoAuthId,
								}
							: null,
				}
			: null,
		cancelamento:
			f.canceladoEm && f.motivoCancelamento
				? { motivo: f.motivoCancelamento, canceladoEm: f.canceladoEm.toISOString() }
				: null,
		criadoEm: f.criadoEm.toISOString(),
		atualizadoEm: f.atualizadoEm.toISOString(),
	}
}

export async function rotasCobrancasAdmin(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const service = new CobrancasService(app.prisma)
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Cobranças'],
				summary: 'Lista cobranças (admin)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: listarCobrancasQuerySchema,
				response: {
					200: z.object({
						itens: z.array(faturaSchema),
						total: z.number(),
						pagina: z.number(),
						porPagina: z.number(),
					}),
				},
			},
			preHandler: guard,
		},
		async (req) => {
			const { itens, total } = await service.listar(req.query)
			return { itens: itens.map(serializarFatura), total, pagina: req.query.pagina, porPagina: req.query.porPagina }
		},
	)

	a.get(
		'/:id',
		{
			schema: {
				tags: ['Cobranças'],
				summary: 'Detalhe de fatura',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 200: faturaSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializarFatura(await service.obter(req.params.id)),
	)

	a.post(
		'/',
		{
			schema: {
				tags: ['Cobranças'],
				summary: 'Cria fatura (gera Boleto + PIX)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: criarCobrancaInputSchema,
				response: { 201: faturaSchema, 404: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req, reply) => {
			const f = await service.criar({
				pedidoId: req.body.pedidoId,
				dataVencimento: new Date(req.body.dataVencimento),
				valor: req.body.valor,
				observacoes: req.body.observacoes,
			})
			return reply.status(201).send(serializarFatura(f))
		},
	)

	a.post(
		'/:id/baixa-manual',
		{
			schema: {
				tags: ['Cobranças'],
				summary: 'Baixa manual de fatura',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: baixaManualInputSchema,
				response: { 200: faturaSchema, 404: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req) =>
			serializarFatura(
				await service.baixaManual(req.params.id, {
					dataPagamento: new Date(req.body.dataPagamento),
					metodoPago: req.body.metodoPago,
					observacoes: req.body.observacoes,
				}),
			),
	)

	a.post(
		'/:id/cancelar',
		{
			schema: {
				tags: ['Cobranças'],
				summary: 'Cancela fatura (registro Febraban)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: cancelarInputSchema,
				response: { 200: faturaSchema, 404: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializarFatura(await service.cancelar(req.params.id, req.body.motivo)),
	)
}

export async function rotasCobrancasCliente(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const service = new CobrancasService(app.prisma)
	const guard = [app.requerCliente]

	a.get(
		'/',
		{
			schema: {
				tags: ['Cobranças (cliente)'],
				summary: 'Lista faturas do cliente logado (paginado)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: z.object({
					status: statusFaturaSchema.optional(),
					pagina: z.coerce.number().int().positive().default(1),
					porPagina: z.coerce.number().int().positive().max(100).default(10),
				}),
				response: {
					200: z.object({
						itens: z.array(faturaSchema),
						total: z.number(),
						pagina: z.number(),
						porPagina: z.number(),
					}),
				},
			},
			preHandler: guard,
		},
		async (req) => {
			const { itens, total } = await service.listarPorCliente(req.sessao.sub, {
				status: req.query.status,
				pagina: req.query.pagina,
				porPagina: req.query.porPagina,
			})
			return {
				itens: itens.map(serializarFatura),
				total,
				pagina: req.query.pagina,
				porPagina: req.query.porPagina,
			}
		},
	)

	a.get(
		'/:id',
		{
			schema: {
				tags: ['Cobranças (cliente)'],
				summary: 'Detalhe de fatura do cliente logado',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 200: faturaSchema, 403: erroSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializarFatura(await service.obterParaCliente(req.params.id, req.sessao.sub)),
	)

	a.post(
		'/:id/pagar-com-cartao',
		{
			schema: {
				tags: ['Cobranças (cliente)'],
				summary: 'Paga fatura com cartão de crédito',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: pagarComCartaoInputSchema,
				response: { 200: faturaSchema, 400: erroSchema, 403: erroSchema, 404: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializarFatura(await service.pagarComCartao(req.params.id, req.sessao.sub, req.body)),
	)
}
