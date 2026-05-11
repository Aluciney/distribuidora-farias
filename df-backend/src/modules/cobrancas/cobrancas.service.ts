import { randomUUID } from 'node:crypto'
import type { Cliente, Fatura, MetodoPagamento, PrismaClient, StatusFatura } from '@prisma/client'
import { getFilaEmailBoleto, getFilaWhatsappBoleto } from '../../queues/filas'
import { NaoEncontrado, Proibido, RegraNegocio } from '../../shared/erros'
import { obterResponsaveisDoCliente } from '../../shared/tenancy'
import { detectarBandeira, ultimosDigitos, validadeFutura, validarLuhn } from '../../shared/utils/cartao'
import { PushService } from '../push/push.service'
import { BoletoMockGerador, type IBoletoGerador } from './boleto.gerador'
import { gerarBoletoPdf } from './boleto.pdf'
import { ConfirmacaoNotificador } from './confirmacao.notificador'
import { type IPixGerador, PixMockGerador } from './pix.gerador'

/** Texto enviado quando a empresa não personaliza a mensagem nas configurações. */
export const MENSAGEM_BOLETO_PADRAO =
	'Olá, {cliente}! Segue o boleto da fatura {numero} no valor de {valor}, com vencimento em {vencimento}.\n\nLinha digitável: {linhaDigitavel}\nPIX: {pix}'

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
	private push: PushService
	private confirmacao: ConfirmacaoNotificador

	constructor(private readonly prisma: PrismaClient) {
		this.push = new PushService(prisma)
		this.confirmacao = new ConfirmacaoNotificador(prisma)
	}

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

	async listarPorClientes(
		clientesIds: string[],
		filtros: {
			status?: StatusFatura
			/** Filtra a uma única filial — útil quando o portal escopa via seletor. */
			filialId?: string
			pagina: number
			porPagina: number
		},
	): Promise<{ itens: (Fatura & { cliente: Cliente })[]; total: number }> {
		if (clientesIds.length === 0) return { itens: [], total: 0 }
		const escopo = filtros.filialId ? (clientesIds.includes(filtros.filialId) ? [filtros.filialId] : []) : clientesIds
		if (escopo.length === 0) {
			throw new Proibido('FILIAL_INACESSIVEL', 'Filial não pertence à sua conta.')
		}
		const where = { clienteId: { in: escopo }, status: filtros.status }
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

	async obter(id: string): Promise<Fatura & { cliente: Cliente }> {
		const f = await this.prisma.fatura.findUnique({ where: { id }, include: { cliente: true } })
		if (!f) throw new NaoEncontrado('Fatura', id)
		return f
	}

	async obterParaUsuarioCliente(id: string, clientesAcessiveis: string[]): Promise<Fatura & { cliente: Cliente }> {
		const f = await this.obter(id)
		if (!clientesAcessiveis.includes(f.clienteId)) throw new Proibido()
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

		// Push para o cliente — fire-and-forget; uma falha aqui não derruba a cobrança.
		void this.push
			.enviarParaCliente({
				clienteId: fatura.clienteId,
				titulo: 'Nova cobrança',
				corpo: `${fatura.numero} no valor de ${formatarBrlCentavos(fatura.valor)} — vence em ${formatarDataBR(fatura.dataVencimento)}.`,
				data: { tipo: 'fatura_criada', faturaId: fatura.id },
			})
			.catch(() => undefined)

		return fatura
	}

	async baixaManual(id: string, input: BaixaManualInput): Promise<Fatura> {
		const fatura = await this.obter(id)
		if (fatura.status !== 'PENDENTE' && fatura.status !== 'VENCIDO') {
			throw new RegraNegocio('FATURA_NAO_BAIXAVEL', `Não é possível baixar fatura com status ${fatura.status}.`)
		}
		const atualizada = await this.prisma.fatura.update({
			where: { id },
			data: {
				status: 'PAGO',
				valorPago: fatura.valor,
				dataPagamento: input.dataPagamento,
				pagamentoMetodo: input.metodoPago,
				observacoes: input.observacoes ?? fatura.observacoes,
			},
		})

		// Notifica o cliente em todos os canais (push + email + whatsapp + audit).
		void this.confirmacao
			.notificar({
				fatura: atualizada,
				cliente: fatura.cliente,
				metodo: input.metodoPago,
				dataPagamento: input.dataPagamento,
			})
			.catch(() => undefined)

		return atualizada
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

		const responsaveis = await obterResponsaveisDoCliente(this.prisma, fatura.clienteId)
		const titulo = 'Fatura cancelada'
		const mensagem = `Sua fatura ${fatura.numero} foi cancelada. Motivo: ${motivo}.`
		if (responsaveis.length === 0) {
			await this.prisma.notificacao.create({
				data: {
					clienteId: fatura.clienteId,
					faturaId: fatura.id,
					titulo,
					mensagem,
					erro: 'FILIAL_SEM_RESPONSAVEL',
				},
			})
		} else {
			await this.prisma.notificacao.createMany({
				data: responsaveis.map((u) => ({
					clienteId: fatura.clienteId,
					usuarioClienteId: u.id,
					faturaId: fatura.id,
					titulo,
					mensagem,
					enviadaEm: new Date(),
				})),
			})
		}
		return atualizada
	}

	async pagarComCartao(id: string, clientesAcessiveis: string[], input: PagarCartaoInput): Promise<Fatura> {
		const fatura = await this.obterParaUsuarioCliente(id, clientesAcessiveis)
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
		const ultimos = ultimosDigitos(input.numero)
		const authId = `MOCK-${randomUUID().split('-')[0].toUpperCase()}`
		const dataPagamento = new Date()

		const atualizada = await this.prisma.fatura.update({
			where: { id },
			data: {
				status: 'PAGO',
				valorPago: fatura.valor,
				dataPagamento,
				pagamentoMetodo: 'CARTAO_CREDITO',
				pagamentoCartaoBandeira: bandeira,
				pagamentoCartaoUltimosDigitos: ultimos,
				pagamentoCartaoParcelas: input.parcelas,
				pagamentoCartaoAuthId: authId,
			},
		})

		void this.confirmacao
			.notificar({
				fatura: atualizada,
				cliente: fatura.cliente,
				metodo: 'CARTAO_CREDITO',
				dataPagamento,
				detalhe: `${bandeira} final ${ultimos} — ${input.parcelas}x`,
			})
			.catch(() => undefined)

		return atualizada
	}

	/**
	 * Valida pré-requisitos (responsável vinculado, telefone, configurações) e
	 * enfileira o envio no Redis. O worker `whatsapp-boleto` consome a fila,
	 * regenera o PDF e dispara via Baileys. Erros de envio são retriáveis com
	 * backoff exponencial (5 tentativas).
	 */
	async enviarBoletoWhatsapp(id: string): Promise<{ enviadoEm: string; destinatario: string }> {
		const fatura = await this.obter(id)
		const cliente = fatura.cliente

		// Telefone agora vive no UsuarioCliente (holding). Pegamos o vínculo
		// principal e usamos o telefone dele; se não houver, qualquer holding
		// ativa serve. Sem holding → erro explícito para o admin vincular.
		const responsaveis = await obterResponsaveisDoCliente(this.prisma, cliente.id)
		if (responsaveis.length === 0) {
			throw new RegraNegocio('FILIAL_SEM_RESPONSAVEL', 'Esta filial não tem holding vinculada — vincule um UsuarioCliente antes de enviar.')
		}
		const acessoPrincipal = await this.prisma.usuarioClienteAcesso.findFirst({
			where: {
				clienteId: cliente.id,
				principal: true,
				usuarioCliente: { ativo: true },
			},
		})
		const responsavel = (acessoPrincipal && responsaveis.find((r) => r.id === acessoPrincipal.usuarioClienteId)) ?? responsaveis[0]
		const telefoneDigitos = responsavel.telefone.replace(/\D/g, '')
		if (telefoneDigitos.length < 10) {
			throw new RegraNegocio('TELEFONE_INVALIDO', 'Holding responsável sem telefone válido.')
		}

		const config = await this.prisma.configuracoesCobranca.findUnique({ where: { id: 'unica' } })
		if (!config) {
			throw new RegraNegocio('CONFIGURACAO_INCOMPLETA', 'Configurações de cobrança não encontradas.')
		}

		await getFilaWhatsappBoleto().add(
			'enviar-boleto',
			{ faturaId: fatura.id, destinatario: telefoneDigitos },
			{ jobId: `boleto-${fatura.id}-${Date.now()}` },
		)

		return { enviadoEm: new Date().toISOString(), destinatario: telefoneDigitos }
	}

	/**
	 * Mesma ideia do `enviarBoletoWhatsapp`, mas via e-mail. Resolve o
	 * destinatário (UsuarioCliente principal → primeiro com e-mail válido) e
	 * enfileira o envio. O worker `email-boleto` regenera o PDF e anexa ao
	 * e-mail SMTP.
	 */
	async enviarBoletoEmail(id: string): Promise<{ enviadoEm: string; destinatario: string }> {
		const fatura = await this.obter(id)
		const cliente = fatura.cliente

		const responsaveis = await obterResponsaveisDoCliente(this.prisma, cliente.id)
		if (responsaveis.length === 0) {
			throw new RegraNegocio('FILIAL_SEM_RESPONSAVEL', 'Esta filial não tem holding vinculada — vincule um UsuarioCliente antes de enviar.')
		}
		const acessoPrincipal = await this.prisma.usuarioClienteAcesso.findFirst({
			where: {
				clienteId: cliente.id,
				principal: true,
				usuarioCliente: { ativo: true },
			},
		})
		const responsavelPrincipal = acessoPrincipal && responsaveis.find((r) => r.id === acessoPrincipal.usuarioClienteId)
		const candidatos = responsavelPrincipal ? [responsavelPrincipal, ...responsaveis.filter((r) => r.id !== responsavelPrincipal.id)] : responsaveis
		const responsavel = candidatos.find((r) => r.email?.trim())
		if (!responsavel || !responsavel.email) {
			throw new RegraNegocio('EMAIL_INVALIDO', 'Holding responsável sem e-mail cadastrado.')
		}
		const email = responsavel.email.trim()

		const config = await this.prisma.configuracoesCobranca.findUnique({ where: { id: 'unica' } })
		if (!config) {
			throw new RegraNegocio('CONFIGURACAO_INCOMPLETA', 'Configurações de cobrança não encontradas.')
		}

		await getFilaEmailBoleto().add(
			'enviar-boleto',
			{ faturaId: fatura.id, destinatario: email },
			{ jobId: `boleto-email-${fatura.id}-${Date.now()}` },
		)

		return { enviadoEm: new Date().toISOString(), destinatario: email }
	}

	/** Gera o PDF da fatura no padrão Febraban (barcode + PIX + linha
	 *  digitável). Mesma função usada no envio via WhatsApp — assim web,
	 *  app e WhatsApp recebem exatamente o mesmo documento. */
	async gerarPdfBoleto(id: string): Promise<{ buffer: Buffer; nomeArquivo: string }> {
		const fatura = await this.obter(id)
		const config = await this.prisma.configuracoesCobranca.findUnique({
			where: { id: 'unica' },
		})
		if (!config) {
			throw new RegraNegocio('CONFIGURACAO_INCOMPLETA', 'Configurações de cobrança não encontradas.')
		}
		const buffer = await gerarBoletoPdf({ fatura, cliente: fatura.cliente, config })
		return { buffer, nomeArquivo: `boleto-${fatura.numero}.pdf` }
	}

	/** Mesma coisa que `gerarPdfBoleto`, mas validando que a fatura pertence
	 *  às filiais acessíveis pelo UsuarioCliente logado. */
	async gerarPdfBoletoParaUsuarioCliente(id: string, clientesAcessiveis: string[]): Promise<{ buffer: Buffer; nomeArquivo: string }> {
		const fatura = await this.obterParaUsuarioCliente(id, clientesAcessiveis)
		const config = await this.prisma.configuracoesCobranca.findUnique({
			where: { id: 'unica' },
		})
		if (!config) {
			throw new RegraNegocio('CONFIGURACAO_INCOMPLETA', 'Configurações de cobrança não encontradas.')
		}
		const buffer = await gerarBoletoPdf({ fatura, cliente: fatura.cliente, config })
		return { buffer, nomeArquivo: `boleto-${fatura.numero}.pdf` }
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

function formatarBrlCentavos(centavos: number): string {
	return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

function formatarDataBR(d: Date): string {
	const dia = String(d.getUTCDate()).padStart(2, '0')
	const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
	return `${dia}/${mes}/${d.getUTCFullYear()}`
}

export function montarMensagem(template: string, fatura: Fatura, cliente: Cliente): string {
	const valor = `R$ ${(fatura.valor / 100).toFixed(2).replace('.', ',')}`
	const venc = fatura.dataVencimento
	const vencimento = `${String(venc.getUTCDate()).padStart(2, '0')}/${String(venc.getUTCMonth() + 1).padStart(2, '0')}/${venc.getUTCFullYear()}`
	const placeholders: Record<string, string> = {
		'{cliente}': cliente.razaoSocial,
		'{numero}': fatura.numero,
		'{valor}': valor,
		'{vencimento}': vencimento,
		'{linhaDigitavel}': fatura.boletoLinhaDigitavel,
		'{pix}': fatura.pixCopiaECola,
	}
	return Object.entries(placeholders).reduce((acc, [chave, valor]) => acc.split(chave).join(valor), template)
}
