import type { CanalNotificacao } from '@prisma/client'
import type { ICanalNotificacao } from './canal.interface'

export class EmailCanalLog implements ICanalNotificacao {
	readonly tipo: CanalNotificacao = 'EMAIL'
	constructor(private readonly logger: { info(msg: object | string): void } = console) {}

	async enviar(input: { destinatario: string; assunto?: string | null; mensagem: string }) {
		this.logger.info({ canal: 'EMAIL', ...input })
		return { enviadoEm: new Date() }
	}
}
