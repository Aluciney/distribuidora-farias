import type { CanalNotificacao } from '@prisma/client'
import type { ICanalNotificacao } from './canal.interface'

export class WhatsAppCanalLog implements ICanalNotificacao {
	readonly tipo: CanalNotificacao = 'WHATSAPP'
	constructor(private readonly logger: { info(msg: object | string): void } = console) {}

	async enviar(input: { destinatario: string; mensagem: string }) {
		this.logger.info({ canal: 'WHATSAPP', ...input })
		return { enviadoEm: new Date() }
	}
}
