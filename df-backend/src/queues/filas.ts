import type { CanalNotificacao } from '@prisma/client'
import { Queue } from 'bullmq'
import { getRedisConnection } from './redis'

export const NOME_FILA_REGUA = 'regua'
export const NOME_FILA_NOTIFICACOES = 'notificacoes'

export const ID_JOB_REGUA_AGENDADO = 'regua-agendada'

export interface DadosJobRegua {
	regraId?: string
	dataReferencia?: string
}

export interface DadosJobNotificacao {
	clienteId: string
	faturaId: string
	regraId: string
	canal: CanalNotificacao
	destinatario: string
	assunto: string | null
	mensagem: string
	tituloRegra: string
}

let filaRegua: Queue<DadosJobRegua> | null = null
let filaNotificacoes: Queue<DadosJobNotificacao> | null = null

export function getFilaRegua(): Queue<DadosJobRegua> {
	if (!filaRegua) {
		filaRegua = new Queue<DadosJobRegua>(NOME_FILA_REGUA, {
			connection: getRedisConnection(),
			defaultJobOptions: {
				removeOnComplete: { age: 60 * 60 * 24, count: 200 },
				removeOnFail: { age: 60 * 60 * 24 * 7 },
			},
		})
	}
	return filaRegua
}

export function getFilaNotificacoes(): Queue<DadosJobNotificacao> {
	if (!filaNotificacoes) {
		filaNotificacoes = new Queue<DadosJobNotificacao>(NOME_FILA_NOTIFICACOES, {
			connection: getRedisConnection(),
			defaultJobOptions: {
				attempts: 5,
				backoff: { type: 'exponential', delay: 5_000 },
				removeOnComplete: { age: 60 * 60 * 24, count: 1_000 },
				removeOnFail: { age: 60 * 60 * 24 * 14 },
			},
		})
	}
	return filaNotificacoes
}

export async function fecharFilas(): Promise<void> {
	if (filaRegua) {
		await filaRegua.close()
		filaRegua = null
	}
	if (filaNotificacoes) {
		await filaNotificacoes.close()
		filaNotificacoes = null
	}
}
