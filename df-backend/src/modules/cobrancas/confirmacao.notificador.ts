/**
 * Notifica os UsuarioCliente vinculados a uma loja sobre confirmação de
 * pagamento via todos os canais disponíveis: registro no audit trail
 * (`notificacoes`), push notification, email e WhatsApp. Cada canal é
 * fire-and-forget — uma falha de WhatsApp (por exemplo, sessão Baileys
 * caída) não bloqueia o fluxo.
 */
import type { Cliente, Fatura, MetodoPagamento, PrismaClient } from '@prisma/client'
import { obterResponsaveisDoCliente } from '../../shared/tenancy'
import type { ICanalNotificacao } from '../notificacoes/canais/canal.interface'
import { EmailCanalLog, EmailCanalSmtp } from '../notificacoes/canais/email.canal'
import { WhatsAppCanalBaileys, WhatsAppCanalLog } from '../notificacoes/canais/whatsapp.canal'
import { PushService } from '../push/push.service'

const METODO_LABEL: Record<MetodoPagamento, string> = {
	BOLETO: 'boleto',
	PIX: 'PIX',
	CARTAO_CREDITO: 'cartão de crédito',
	DINHEIRO: 'dinheiro',
}

/** Fallback quando o admin ainda não personalizou o texto. */
export const MENSAGEM_CONFIRMACAO_PADRAO =
	'Olá, {cliente}.\n\nRecebemos o pagamento da fatura {numero} no valor de {valor} via {metodo}{detalhe} em {data}.\n\nObrigado pela parceria.'

export interface ConfirmacaoInput {
	fatura: Fatura
	cliente: Cliente
	metodo: MetodoPagamento
	/** Quando o pagamento foi efetivamente registrado. */
	dataPagamento: Date
	/** Detalhe extra (ex.: "VISA final 1234 — 3x"). Aparece nos canais. */
	detalhe?: string
}

export class ConfirmacaoNotificador {
	private push: PushService
	private email: ICanalNotificacao
	private whatsapp: ICanalNotificacao

	constructor(prisma: PrismaClient, private readonly db: PrismaClient = prisma) {
		this.push = new PushService(prisma)
		this.email = process.env.SMTP_HOST ? new EmailCanalSmtp() : new EmailCanalLog()
		this.whatsapp =
			process.env.WHATSAPP_HABILITADO === 'true'
				? new WhatsAppCanalBaileys()
				: new WhatsAppCanalLog()
	}

	async notificar(input: ConfirmacaoInput): Promise<void> {
		const titulo = 'Pagamento confirmado'
		const config = await this.db.configuracoesCobranca.findUnique({
			where: { id: 'unica' },
			select: { whatsappMensagemConfirmacao: true },
		})
		const corpo = montarMensagem(
			input,
			config?.whatsappMensagemConfirmacao ?? MENSAGEM_CONFIRMACAO_PADRAO,
		)

		const responsaveis = await obterResponsaveisDoCliente(this.db, input.cliente.id)

		// 1. Registro no painel — uma notificação por holding (ou uma única
		// sem destinatário se filial órfã, para o admin enxergar o gap).
		if (responsaveis.length === 0) {
			await this.db.notificacao
				.create({
					data: {
						clienteId: input.cliente.id,
						faturaId: input.fatura.id,
						titulo,
						mensagem: corpo,
						erro: 'FILIAL_SEM_RESPONSAVEL',
					},
				})
				.catch(() => undefined)
		} else {
			await Promise.all(
				responsaveis.map((u) =>
					this.db.notificacao
						.create({
							data: {
								clienteId: input.cliente.id,
								usuarioClienteId: u.id,
								faturaId: input.fatura.id,
								titulo,
								mensagem: corpo,
								enviadaEm: new Date(),
							},
						})
						.catch(() => undefined),
				),
			)
		}

		// 2. Push notification — único batch para todos os tokens da loja.
		void this.push
			.enviarParaCliente({
				clienteId: input.cliente.id,
				titulo,
				corpo,
				data: { tipo: 'pagamento_confirmado', faturaId: input.fatura.id },
			})
			.catch(() => undefined)

		// 3. Email + WhatsApp — um envio por DESTINATÁRIO único. Quando a
		// mesma pessoa está cadastrada como holding em mais de uma filial
		// (ou duas holdings compartilham telefone/email), o loop ingênuo por
		// `responsaveis` mandava a mesma mensagem várias vezes pro mesmo
		// número. Deduplica antes de disparar.
		const emailsEnviados = new Set<string>()
		const telefonesEnviados = new Set<string>()

		for (const u of responsaveis) {
			if (u.email) {
				const email = u.email.trim().toLowerCase()
				if (email && !emailsEnviados.has(email)) {
					emailsEnviados.add(email)
					void this.email
						.enviar({
							destinatario: email,
							assunto: `Pagamento confirmado — Fatura ${input.fatura.numero}`,
							mensagem: corpo,
						})
						.catch((err) => console.warn('[confirmacao] falha no email:', err))
				}
			}
			const tel = u.telefone?.replace(/\D/g, '') ?? ''
			if (tel.length >= 10 && !telefonesEnviados.has(tel)) {
				telefonesEnviados.add(tel)
				void this.whatsapp
					.enviar({ destinatario: tel, mensagem: corpo })
					.catch((err) => console.warn('[confirmacao] falha no whatsapp:', err))
			}
		}
	}
}

function montarMensagem(input: ConfirmacaoInput, template: string): string {
	const placeholders: Record<string, string> = {
		'{cliente}': input.cliente.razaoSocial,
		'{numero}': input.fatura.numero,
		'{valor}': formatarBrl(input.fatura.valor),
		'{metodo}': METODO_LABEL[input.metodo] ?? input.metodo,
		'{data}': formatarData(input.dataPagamento),
		'{detalhe}': input.detalhe ? ` (${input.detalhe})` : '',
	}
	return Object.entries(placeholders).reduce(
		(acc, [chave, valor]) => acc.split(chave).join(valor),
		template,
	)
}

function formatarBrl(centavos: number): string {
	return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`
}

function formatarData(d: Date): string {
	const dia = String(d.getUTCDate()).padStart(2, '0')
	const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
	return `${dia}/${mes}/${d.getUTCFullYear()}`
}
