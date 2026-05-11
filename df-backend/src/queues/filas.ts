import type { CanalNotificacao } from '@prisma/client'
import { Queue } from 'bullmq'
import { getRedisConnection } from './redis'

export const NOME_FILA_REGUA = 'regua'
export const NOME_FILA_NOTIFICACOES = 'notificacoes'
export const NOME_FILA_WHATSAPP_BOLETO = 'whatsapp-boleto'

export const ID_JOB_REGUA_AGENDADO = 'regua-agendada'

export interface DadosJobRegua {
	regraId?: string
	dataReferencia?: string
}

export interface DadosJobNotificacao {
	clienteId: string
	/** Holding destinatária do disparo. Sempre definida na régua (resolvida
	 * antes do enfileiramento). */
	usuarioClienteId: string
	faturaId: string
	regraId: string
	canal: CanalNotificacao
	destinatario: string
	assunto: string | null
	mensagem: string
	tituloRegra: string
}

/** Envio manual do boleto em PDF via WhatsApp (botão na tela de cobrança).
 *  O worker regenera o PDF a partir do `faturaId` — assim não trafegamos
 *  bytes pesados pelo Redis. */
export interface DadosJobWhatsappBoleto {
	faturaId: string
	destinatario: string
}

let filaRegua: Queue<DadosJobRegua> | null = null
let filaNotificacoes: Queue<DadosJobNotificacao> | null = null
let filaWhatsappBoleto: Queue<DadosJobWhatsappBoleto> | null = null

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

export function getFilaWhatsappBoleto(): Queue<DadosJobWhatsappBoleto> {
	if (!filaWhatsappBoleto) {
		filaWhatsappBoleto = new Queue<DadosJobWhatsappBoleto>(NOME_FILA_WHATSAPP_BOLETO, {
			connection: getRedisConnection(),
			defaultJobOptions: {
				attempts: 5,
				// Backoff mais espaçado: se o WhatsApp estiver desconectado, dá
				// tempo do admin reconectar antes de gastar todas as tentativas.
				backoff: { type: 'exponential', delay: 15_000 },
				removeOnComplete: { age: 60 * 60 * 24, count: 500 },
				removeOnFail: { age: 60 * 60 * 24 * 14 },
			},
		})
	}
	return filaWhatsappBoleto
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
	if (filaWhatsappBoleto) {
		await filaWhatsappBoleto.close()
		filaWhatsappBoleto = null
	}
}
