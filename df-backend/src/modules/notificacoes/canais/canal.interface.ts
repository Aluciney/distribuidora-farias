import type { CanalNotificacao } from '@prisma/client'

export interface ICanalNotificacao {
	readonly tipo: CanalNotificacao
	enviar(input: {
		destinatario: string
		assunto?: string | null
		mensagem: string
	}): Promise<{ enviadoEm: Date }>
}
