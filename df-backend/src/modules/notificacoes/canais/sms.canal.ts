import type { CanalNotificacao } from '@prisma/client'
import type { ICanalNotificacao } from './canal.interface'

export class SmsCanalLog implements ICanalNotificacao {
	readonly tipo: CanalNotificacao = 'SMS'
	constructor(private readonly logger: { info(msg: object | string): void } = console) {}

	async enviar(input: { destinatario: string; mensagem: string }) {
		this.logger.info({ canal: 'SMS', ...input })
		return { enviadoEm: new Date() }
	}
}
