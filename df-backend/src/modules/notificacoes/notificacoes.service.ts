import type { CanalNotificacao, Cliente, Fatura, PrismaClient } from '@prisma/client'
import { format } from 'date-fns'

/**
 * Início do dia em UTC. Usamos UTC porque `dataVencimento` é gravado em UTC
 * pelo Prisma — comparar por dia local introduz um deslocamento de N horas
 * (igual ao offset do fuso) que faz a janela perder faturas legítimas.
 */
function startOfUTCDay(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addUTCDays(d: Date, days: number): Date {
	return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}
import { type DadosJobNotificacao, getFilaNotificacoes } from '../../queues/filas'
import { formatarBrl } from '../../shared/utils/moeda'
import type { ICanalNotificacao } from './canais/canal.interface'
import { EmailCanalLog, EmailCanalSmtp } from './canais/email.canal'
import { SmsCanalLog } from './canais/sms.canal'
import { WhatsAppCanalBaileys, WhatsAppCanalLog } from './canais/whatsapp.canal'

interface ExecutarOpcoes {
	regraId?: string
	dataReferencia?: Date
}

interface Logger {
	info(obj: object | string, msg?: string): void
	warn(obj: object | string, msg?: string): void
}

const noopLogger: Logger = { info: () => undefined, warn: () => undefined }

export class NotificacoesService {
	private canais: Map<CanalNotificacao, ICanalNotificacao>

	constructor(
		private readonly prisma: PrismaClient,
		canais?: Partial<Record<CanalNotificacao, ICanalNotificacao>>,
		private readonly logger: Logger = noopLogger,
	) {
		this.canais = new Map<CanalNotificacao, ICanalNotificacao>([
			['EMAIL', canais?.EMAIL ?? defaultCanalEmail()],
			['WHATSAPP', canais?.WHATSAPP ?? defaultCanalWhatsApp()],
			['SMS', canais?.SMS ?? new SmsCanalLog()],
		])
	}

	/**
	 * Varre regras ativas e enfileira um job de notificação para cada (fatura × ação).
	 * O envio em si fica a cargo do worker BullMQ que consome `notificacoes`.
	 */
	async enfileirarRegua(opts: ExecutarOpcoes = {}): Promise<{ enfileirados: number }> {
		const hoje = startOfUTCDay(opts.dataReferencia ?? new Date())
		const regras = await this.prisma.regraCobranca.findMany({
			where: { ativo: true, ...(opts.regraId ? { id: opts.regraId } : {}) },
			include: { acoes: true },
		})

		this.logger.info(
			{ hojeUTC: hoje.toISOString(), regrasAtivas: regras.length },
			'🔍 Varredura da régua iniciada',
		)
		if (regras.length === 0) {
			this.logger.warn('Nenhuma regra ativa encontrada — verifique se as regras estão marcadas como `ativo: true`')
		}

		const fila = getFilaNotificacoes()
		let enfileirados = 0

		for (const regra of regras) {
			const alvo = addUTCDays(hoje, -regra.diasOffset)
			const inicio = startOfUTCDay(alvo)
			const fim = addUTCDays(inicio, 1)
			const faturas = await this.prisma.fatura.findMany({
				where: {
					status: { in: ['PENDENTE', 'VENCIDO'] },
					dataVencimento: { gte: inicio, lt: fim },
				},
				include: { cliente: true },
			})

			this.logger.info(
				{
					regra: regra.nome,
					diasOffset: regra.diasOffset,
					gatilho: regra.gatilho,
					janela: { inicio: inicio.toISOString(), fim: fim.toISOString() },
					faturasEncontradas: faturas.length,
					acoes: regra.acoes.length,
				},
				`📋 Regra "${regra.nome}" — ${faturas.length} fatura(s) na janela`,
			)
			if (faturas.length === 0) {
				const total = await this.prisma.fatura.count({
					where: { status: { in: ['PENDENTE', 'VENCIDO'] } },
				})
				this.logger.warn(
					{ totalPendentesOuVencidas: total },
					`Nenhuma fatura PENDENTE/VENCIDO com vencimento em [${inicio.toISOString()}, ${fim.toISOString()})`,
				)
			}

			for (const fatura of faturas) {
				for (const acao of regra.acoes) {
					const mensagem = this.renderizar(acao.mensagem, fatura, fatura.cliente)
					const assunto = acao.assunto ? this.renderizar(acao.assunto, fatura, fatura.cliente) : null
					const destinatario = this.destinatarioPara(acao.canal, fatura.cliente)
					const payload: DadosJobNotificacao = {
						clienteId: fatura.clienteId,
						faturaId: fatura.id,
						regraId: regra.id,
						canal: acao.canal,
						destinatario,
						assunto,
						mensagem,
						tituloRegra: regra.nome,
					}
					// Não pode conter `:` — BullMQ reserva esse caractere para chaves internas.
					const jobId = `${regra.id}_${fatura.id}_${acao.id}_${format(hoje, 'yyyy-MM-dd')}`
					await fila.add('disparar', payload, { jobId })
					enfileirados++
				}
			}
		}

		return { enfileirados }
	}

	/**
	 * Dispara uma única notificação (chamado pelo worker BullMQ).
	 * Em caso de erro, registra o erro no audit trail e re-lança para o BullMQ tentar de novo.
	 */
	async disparar(payload: DadosJobNotificacao): Promise<void> {
		const canal = this.canais.get(payload.canal)
		if (!canal) {
			throw new Error(`Canal ${payload.canal} não tem dispatcher registrado.`)
		}

		try {
			const { enviadoEm } = await canal.enviar({
				destinatario: payload.destinatario,
				assunto: payload.assunto,
				mensagem: payload.mensagem,
			})
			await this.prisma.notificacao.create({
				data: {
					clienteId: payload.clienteId,
					faturaId: payload.faturaId,
					regraId: payload.regraId,
					canal: payload.canal,
					titulo: payload.assunto ?? `Aviso da régua ${payload.tituloRegra}`,
					mensagem: payload.mensagem,
					enviadaEm: enviadoEm,
				},
			})
		} catch (err) {
			await this.prisma.notificacao.create({
				data: {
					clienteId: payload.clienteId,
					faturaId: payload.faturaId,
					regraId: payload.regraId,
					canal: payload.canal,
					titulo: `Falha no disparo da régua ${payload.tituloRegra}`,
					mensagem: payload.mensagem,
					erro: err instanceof Error ? err.message : 'Erro desconhecido',
				},
			})
			throw err
		}
	}

	/**
	 * Mantido por compatibilidade — execução síncrona usada por testes/disparo manual.
	 * Em produção, prefira `enfileirarRegua` (que delega ao worker BullMQ).
	 */
	async executarRegua(opts: ExecutarOpcoes = {}): Promise<{ disparadas: number; erros: number }> {
		const hoje = startOfUTCDay(opts.dataReferencia ?? new Date())
		const regras = await this.prisma.regraCobranca.findMany({
			where: { ativo: true, ...(opts.regraId ? { id: opts.regraId } : {}) },
			include: { acoes: true },
		})

		let disparadas = 0
		let erros = 0

		for (const regra of regras) {
			const alvo = addUTCDays(hoje, -regra.diasOffset)
			const inicio = startOfUTCDay(alvo)
			const fim = addUTCDays(inicio, 1)
			const faturas = await this.prisma.fatura.findMany({
				where: {
					status: { in: ['PENDENTE', 'VENCIDO'] },
					dataVencimento: { gte: inicio, lt: fim },
				},
				include: { cliente: true },
			})

			for (const fatura of faturas) {
				for (const acao of regra.acoes) {
					const payload: DadosJobNotificacao = {
						clienteId: fatura.clienteId,
						faturaId: fatura.id,
						regraId: regra.id,
						canal: acao.canal,
						destinatario: this.destinatarioPara(acao.canal, fatura.cliente),
						assunto: acao.assunto ? this.renderizar(acao.assunto, fatura, fatura.cliente) : null,
						mensagem: this.renderizar(acao.mensagem, fatura, fatura.cliente),
						tituloRegra: regra.nome,
					}
					try {
						await this.disparar(payload)
						disparadas++
					} catch {
						erros++
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

function defaultCanalEmail(): ICanalNotificacao {
	return process.env.SMTP_HOST ? new EmailCanalSmtp() : new EmailCanalLog()
}

function defaultCanalWhatsApp(): ICanalNotificacao {
	return process.env.WHATSAPP_HABILITADO === 'true' ? new WhatsAppCanalBaileys() : new WhatsAppCanalLog()
}
