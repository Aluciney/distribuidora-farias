import { randomUUID } from 'node:crypto'
import type { Cliente, Fatura, MetodoPagamento, PrismaClient, StatusFatura } from '@prisma/client'
import { NaoEncontrado, Proibido, RegraNegocio } from '../../shared/erros'
import { detectarBandeira, ultimosDigitos, validadeFutura, validarLuhn } from '../../shared/utils/cartao'
import { type IBoletoGerador, BoletoMockGerador } from './boleto.gerador'
import { type IPixGerador, PixMockGerador } from './pix.gerador'

interface CriarInput {
	pedidoId: string
	dataVencimento: Date
	valor?: number
	observacoes?: string | null
}

interface BaixaManualInput {
	dataPagamento: Date
	metodoPago: MetodoPagamento
	observacoes?: string | null
}

interface PagarCartaoInput {
	numero: string
	nomeImpresso: string
	validade: string
	cvv: string
	parcelas: number
}

export class CobrancasService {
	private boleto: IBoletoGerador = new BoletoMockGerador()
	private pix: IPixGerador = new PixMockGerador()

	constructor(private readonly prisma: PrismaClient) {}

	async listar(filtros: {
		busca?: string
		status?: StatusFatura
		clienteId?: string
		pagina: number
		porPagina: number
	}): Promise<{ itens: (Fatura & { cliente: Cliente })[]; total: number }> {
		const where = {
			status: filtros.status,
			clienteId: filtros.clienteId,
			...(filtros.busca
				? {
						OR: [
							{ numero: { contains: filtros.busca, mode: 'insensitive' as const } },
							{ pedido: { numero: { contains: filtros.busca, mode: 'insensitive' as const } } },
							{ cliente: { razaoSocial: { contains: filtros.busca, mode: 'insensitive' as const } } },
						],
					}
				: {}),
		}
		const [itens, total] = await Promise.all([
			this.prisma.fatura.findMany({
				where,
				include: { cliente: true },
				orderBy: { dataVencimento: 'desc' },
				skip: (filtros.pagina - 1) * filtros.porPagina,
				take: filtros.porPagina,
			}),
			this.prisma.fatura.count({ where }),
		])
		return { itens, total }
	}

	async listarPorCliente(clienteId: string, status?: StatusFatura): Promise<(Fatura & { cliente: Cliente })[]> {
		return this.prisma.fatura.findMany({
			where: { clienteId, status },
			include: { cliente: true },
			orderBy: { dataVencimento: 'desc' },
		})
	}

	async obter(id: string): Promise<Fatura & { cliente: Cliente }> {
		const f = await this.prisma.fatura.findUnique({ where: { id }, include: { cliente: true } })
		if (!f) throw new NaoEncontrado('Fatura', id)
		return f
	}

	async obterParaCliente(id: string, clienteId: string): Promise<Fatura & { cliente: Cliente }> {
		const f = await this.obter(id)
		if (f.clienteId !== clienteId) throw new Proibido()
		return f
	}

	async criar(input: CriarInput): Promise<Fatura> {
		const pedido = await this.prisma.pedido.findUnique({ where: { id: input.pedidoId } })
		if (!pedido) throw new NaoEncontrado('Pedido', input.pedidoId)
		const config = await this.prisma.configuracoesCobranca.findUnique({ where: { id: 'unica' } })
		if (!config || !config.bancoCodigo || !config.pixChave) {
			throw new RegraNegocio('CONFIGURACAO_INCOMPLETA', 'Configurações de cobrança incompletas. Preencha banco e PIX antes de gerar faturas.')
		}

		const valor = input.valor ?? pedido.valorTotal
		const dataEmissao = new Date()
		const numero = await this.gerarNumeroFatura()
		const nossoNumero = String(config.bancoProximoNossoNumero).padStart(8, '0')

		const [boleto, pix] = await Promise.all([
			this.boleto.gerar({ valor, dataVencimento: input.dataVencimento, nossoNumero, config }),
			this.pix.gerar({ valor, config }),
		])

		const fatura = await this.prisma.$transaction(async (tx) => {
			await tx.configuracoesCobranca.update({
				where: { id: 'unica' },
				data: { bancoProximoNossoNumero: { increment: 1 } },
			})
			return tx.fatura.create({
				data: {
					numero,
					pedidoId: pedido.id,
					clienteId: pedido.clienteId,
					valor,
					status: 'PENDENTE',
					dataEmissao,
					dataVencimento: input.dataVencimento,
					observacoes: input.observacoes ?? null,
					boletoLinhaDigitavel: boleto.linhaDigitavel,
					boletoCodigoBarras: boleto.codigoBarras,
					boletoNossoNumero: boleto.nossoNumero,
					boletoUrl: boleto.urlPdf ?? null,
					pixCopiaECola: pix.copiaECola,
					pixQrCode: pix.qrCode,
					pixTxid: pix.txid,
					pixExpiraEm: pix.expiraEm ?? null,
				},
			})
		})

		return fatura
	}

	async baixaManual(id: string, input: BaixaManualInput): Promise<Fatura> {
		const fatura = await this.obter(id)
		if (fatura.status !== 'PENDENTE' && fatura.status !== 'VENCIDO') {
			throw new RegraNegocio('FATURA_NAO_BAIXAVEL', `Não é possível baixar fatura com status ${fatura.status}.`)
		}
		return this.prisma.fatura.update({
			where: { id },
			data: {
				status: 'PAGO',
				valorPago: fatura.valor,
				dataPagamento: input.dataPagamento,
				pagamentoMetodo: input.metodoPago,
				observacoes: input.observacoes ?? fatura.observacoes,
			},
		})
	}

	async cancelar(id: string, motivo: string): Promise<Fatura> {
		const fatura = await this.obter(id)
		if (fatura.status !== 'PENDENTE' && fatura.status !== 'VENCIDO') {
			throw new RegraNegocio('FATURA_NAO_CANCELAVEL', `Não é possível cancelar fatura com status ${fatura.status}.`)
		}
		const atualizada = await this.prisma.fatura.update({
			where: { id },
			data: { status: 'CANCELADO', motivoCancelamento: motivo, canceladoEm: new Date() },
		})
		await this.prisma.notificacao.create({
			data: {
				clienteId: fatura.clienteId,
				faturaId: fatura.id,
				titulo: 'Fatura cancelada',
				mensagem: `Sua fatura ${fatura.numero} foi cancelada. Motivo: ${motivo}.`,
				enviadaEm: new Date(),
			},
		})
		return atualizada
	}

	async pagarComCartao(id: string, clienteId: string, input: PagarCartaoInput): Promise<Fatura> {
		const fatura = await this.obterParaCliente(id, clienteId)
		if (fatura.status !== 'PENDENTE' && fatura.status !== 'VENCIDO') {
			throw new RegraNegocio('FATURA_NAO_PAGAVEL', `Não é possível pagar fatura com status ${fatura.status}.`)
		}
		if (!validarLuhn(input.numero)) {
			throw new RegraNegocio('CARTAO_INVALIDO', 'Número de cartão inválido (Luhn).')
		}
		if (!validadeFutura(input.validade)) {
			throw new RegraNegocio('CARTAO_VENCIDO', 'Validade do cartão expirada.')
		}

		const bandeira = detectarBandeira(input.numero)
		const authId = `MOCK-${randomUUID().split('-')[0].toUpperCase()}`

		const atualizada = await this.prisma.fatura.update({
			where: { id },
			data: {
				status: 'PAGO',
				valorPago: fatura.valor,
				dataPagamento: new Date(),
				pagamentoMetodo: 'CARTAO_CREDITO',
				pagamentoCartaoBandeira: bandeira,
				pagamentoCartaoUltimosDigitos: ultimosDigitos(input.numero),
				pagamentoCartaoParcelas: input.parcelas,
				pagamentoCartaoAuthId: authId,
			},
		})

		await this.prisma.notificacao.create({
			data: {
				clienteId,
				faturaId: id,
				titulo: 'Pagamento confirmado',
				mensagem: `Sua fatura ${fatura.numero} foi paga com cartão ${bandeira} em ${input.parcelas}x.`,
				enviadaEm: new Date(),
			},
		})

		return atualizada
	}

	private async gerarNumeroFatura(): Promise<string> {
		const ano = new Date().getFullYear()
		const prefixo = `FAT-${ano}-`
		const ultima = await this.prisma.fatura.findFirst({
			where: { numero: { startsWith: prefixo } },
			orderBy: { numero: 'desc' },
		})
		const seq = ultima ? Number(ultima.numero.split('-').pop()) + 1 : 1
		return `${prefixo}${String(seq).padStart(4, '0')}`
	}
}
