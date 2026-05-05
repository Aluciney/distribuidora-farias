import type { CanalNotificacao, Cliente, Fatura, PrismaClient } from '@prisma/client'
import { addDays, format, startOfDay } from 'date-fns'
import { formatarBrl } from '../../shared/utils/moeda'
import type { ICanalNotificacao } from './canais/canal.interface'
import { EmailCanalLog } from './canais/email.canal'
import { SmsCanalLog } from './canais/sms.canal'
import { WhatsAppCanalLog } from './canais/whatsapp.canal'

interface ExecutarOpcoes {
	regraId?: string
	dataReferencia?: Date
}

export class NotificacoesService {
	private canais: Map<CanalNotificacao, ICanalNotificacao>

	constructor(
		private readonly prisma: PrismaClient,
		canais?: Partial<Record<CanalNotificacao, ICanalNotificacao>>,
	) {
		this.canais = new Map<CanalNotificacao, ICanalNotificacao>([
			['EMAIL', canais?.EMAIL ?? new EmailCanalLog()],
			['WHATSAPP', canais?.WHATSAPP ?? new WhatsAppCanalLog()],
			['SMS', canais?.SMS ?? new SmsCanalLog()],
		])
	}

	async executarRegua(opts: ExecutarOpcoes = {}): Promise<{ disparadas: number; erros: number }> {
		const hoje = startOfDay(opts.dataReferencia ?? new Date())
		const regras = await this.prisma.regraCobranca.findMany({
			where: { ativo: true, ...(opts.regraId ? { id: opts.regraId } : {}) },
			include: { acoes: true },
		})

		let disparadas = 0
		let erros = 0

		for (const regra of regras) {
			const alvo = addDays(hoje, -regra.diasOffset)
			const inicio = startOfDay(alvo)
			const fim = addDays(inicio, 1)
			const faturas = await this.prisma.fatura.findMany({
				where: {
					status: { in: ['PENDENTE', 'VENCIDO'] },
					dataVencimento: { gte: inicio, lt: fim },
				},
				include: { cliente: true },
			})

			for (const fatura of faturas) {
				for (const acao of regra.acoes) {
					try {
						const canal = this.canais.get(acao.canal)
						if (!canal) continue
						const mensagem = this.renderizar(acao.mensagem, fatura, fatura.cliente)
						const assunto = acao.assunto ? this.renderizar(acao.assunto, fatura, fatura.cliente) : null
						const destinatario = this.destinatarioPara(acao.canal, fatura.cliente)
						const { enviadoEm } = await canal.enviar({ destinatario, assunto, mensagem })
						await this.prisma.notificacao.create({
							data: {
								clienteId: fatura.clienteId,
								faturaId: fatura.id,
								regraId: regra.id,
								canal: acao.canal,
								titulo: assunto ?? `Aviso da régua ${regra.nome}`,
								mensagem,
								enviadaEm: enviadoEm,
							},
						})
						disparadas++
					} catch (err) {
						erros++
						await this.prisma.notificacao.create({
							data: {
								clienteId: fatura.clienteId,
								faturaId: fatura.id,
								regraId: regra.id,
								canal: acao.canal,
								titulo: `Falha no disparo da régua ${regra.nome}`,
								mensagem: acao.mensagem,
								erro: err instanceof Error ? err.message : 'Erro desconhecido',
							},
						})
					}
				}
			}
		}

		return { disparadas, erros }
	}

	private renderizar(template: string, fatura: Fatura, cliente: Cliente): string {
		return template
			.replaceAll('{{cliente}}', cliente.razaoSocial)
			.replaceAll('{{numero}}', fatura.numero)
			.replaceAll('{{valor}}', formatarBrl(fatura.valor))
			.replaceAll('{{vencimento}}', format(fatura.dataVencimento, 'dd/MM/yyyy'))
			.replaceAll('{{linha}}', fatura.boletoLinhaDigitavel)
			.replaceAll('{{pix}}', fatura.pixCopiaECola)
	}

	private destinatarioPara(canal: CanalNotificacao, cliente: Cliente): string {
		if (canal === 'EMAIL') return cliente.email
		return cliente.telefone
	}
}
