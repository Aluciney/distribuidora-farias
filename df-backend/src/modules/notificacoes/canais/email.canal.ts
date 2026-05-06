import type { CanalNotificacao } from '@prisma/client'
import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../../../env'
import type { ICanalNotificacao } from './canal.interface'

export class EmailCanalLog implements ICanalNotificacao {
	readonly tipo: CanalNotificacao = 'EMAIL'
	constructor(private readonly logger: { info(msg: object | string): void } = console) {}

	async enviar(input: { destinatario: string; assunto?: string | null; mensagem: string }) {
		this.logger.info({ canal: 'EMAIL', ...input })
		return { enviadoEm: new Date() }
	}
}

let transporterCache: Transporter | null = null

function getTransporter(): Transporter {
	if (transporterCache) return transporterCache
	if (!env.SMTP_HOST || !env.SMTP_PORT) {
		throw new Error('SMTP não configurado (defina SMTP_HOST e SMTP_PORT no .env).')
	}
	transporterCache = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		secure: env.SMTP_SECURE,
		auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
	})
	return transporterCache
}

export class EmailCanalSmtp implements ICanalNotificacao {
	readonly tipo: CanalNotificacao = 'EMAIL'

	async enviar(input: { destinatario: string; assunto?: string | null; mensagem: string }) {
		const transporter = getTransporter()
		const from = env.SMTP_FROM ?? env.SMTP_USER
		if (!from) {
			throw new Error('SMTP_FROM (ou SMTP_USER) não configurado.')
		}
		await transporter.sendMail({
			from,
			to: input.destinatario,
			subject: input.assunto ?? 'Notificação',
			text: input.mensagem,
			html: input.mensagem.replace(/\n/g, '<br/>'),
		})
		return { enviadoEm: new Date() }
	}
}
