/**
 * Push notifications via Expo Push API.
 *
 * Cada device registrado no portal mobile guarda um `ExponentPushToken[xxxx]`
 * em `dispositivos_push`. Para enviar, montamos um batch e mandamos para
 * `https://exp.host/--/api/v2/push/send` (até 100 mensagens por request).
 *
 * Tokens com erro `DeviceNotRegistered` são apagados — o app foi desinstalado
 * ou o usuário desabilitou push, e mantê-los só polui o banco.
 */
import type { PrismaClient } from '@prisma/client'
import axios from 'axios'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface ExpoPushMessage {
	to: string
	title?: string
	body?: string
	data?: Record<string, unknown>
	sound?: 'default' | null
	priority?: 'default' | 'normal' | 'high'
	channelId?: string
}

interface ExpoTicket {
	status: 'ok' | 'error'
	id?: string
	message?: string
	details?: { error?: string }
}

interface ExpoResponse {
	data: ExpoTicket[]
}

interface Logger {
	info(...args: unknown[]): void
	warn(...args: unknown[]): void
	error(...args: unknown[]): void
}

const noopLogger: Logger = {
	info: () => undefined,
	warn: (...a) => console.warn('[push]', ...a),
	error: (...a) => console.error('[push]', ...a),
}

export interface EnviarPushInput {
	clienteId: string
	titulo: string
	corpo: string
	/** Payload entregue ao app no `notification.request.content.data`. */
	data?: Record<string, unknown>
}

export class PushService {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly logger: Logger = noopLogger,
	) {}

	async registrarToken(input: {
		clienteId: string
		token: string
		plataforma?: string | null
	}): Promise<void> {
		if (!isTokenExpoValido(input.token)) {
			throw new Error('Token Expo inválido. Esperado formato ExponentPushToken[...].')
		}
		await this.prisma.dispositivoPush.upsert({
			where: { token: input.token },
			update: {
				clienteId: input.clienteId,
				plataforma: input.plataforma ?? null,
				ultimoUso: new Date(),
			},
			create: {
				clienteId: input.clienteId,
				token: input.token,
				plataforma: input.plataforma ?? null,
			},
		})
	}

	async removerToken(token: string): Promise<void> {
		await this.prisma.dispositivoPush
			.delete({ where: { token } })
			.catch(() => undefined)
	}

	async enviarParaCliente(input: EnviarPushInput): Promise<{ enviados: number }> {
		const dispositivos = await this.prisma.dispositivoPush.findMany({
			where: { clienteId: input.clienteId },
		})
		if (dispositivos.length === 0) {
			this.logger.info(
				`Cliente ${input.clienteId} sem dispositivos cadastrados — push ignorado.`,
			)
			return { enviados: 0 }
		}

		const mensagens: ExpoPushMessage[] = dispositivos.map((d) => ({
			to: d.token,
			title: input.titulo,
			body: input.corpo,
			data: input.data,
			sound: 'default',
			priority: 'high',
			channelId: 'default',
		}))

		try {
			const tickets = await this.enviarBatch(mensagens)
			const tokensInvalidos: string[] = []
			tickets.forEach((ticket, idx) => {
				if (ticket.status === 'error') {
					const erro = ticket.details?.error
					this.logger.warn(
						`Falha no push (${dispositivos[idx].token}): ${ticket.message} [${erro ?? 'desconhecido'}]`,
					)
					if (erro === 'DeviceNotRegistered') {
						tokensInvalidos.push(dispositivos[idx].token)
					}
				}
			})

			if (tokensInvalidos.length > 0) {
				await this.prisma.dispositivoPush.deleteMany({
					where: { token: { in: tokensInvalidos } },
				})
				this.logger.info(
					`Removidos ${tokensInvalidos.length} tokens com DeviceNotRegistered.`,
				)
			}

			const sucessos = tickets.filter((t) => t.status === 'ok').length
			if (sucessos > 0) {
				await this.prisma.dispositivoPush.updateMany({
					where: { clienteId: input.clienteId },
					data: { ultimoUso: new Date() },
				})
			}
			return { enviados: sucessos }
		} catch (err) {
			this.logger.error('Falha ao chamar Expo Push API', err)
			return { enviados: 0 }
		}
	}

	private async enviarBatch(mensagens: ExpoPushMessage[]): Promise<ExpoTicket[]> {
		const lotes: ExpoPushMessage[][] = []
		for (let i = 0; i < mensagens.length; i += 100) {
			lotes.push(mensagens.slice(i, i + 100))
		}
		const tickets: ExpoTicket[] = []
		for (const lote of lotes) {
			const res = await axios.post<ExpoResponse>(EXPO_PUSH_URL, lote, {
				headers: {
					Accept: 'application/json',
					'Accept-encoding': 'gzip, deflate',
					'Content-Type': 'application/json',
				},
				timeout: 10_000,
			})
			tickets.push(...res.data.data)
		}
		return tickets
	}
}

function isTokenExpoValido(token: string): boolean {
	return /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token)
}
