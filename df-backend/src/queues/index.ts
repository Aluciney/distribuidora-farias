import type { Worker } from 'bullmq'
import type { FastifyInstance } from 'fastify'
import { env } from '../env'
import { whatsappService } from '../modules/whatsapp/whatsapp.service'
import { fecharFilas } from './filas'
import { closeRedisConnection } from './redis'
import { iniciarNotificacoesWorker } from './workers/notificacoes.worker'
import { iniciarReguaWorker } from './workers/regua.worker'

let workers: Worker[] = []

export async function bootstrapWorkers(app: FastifyInstance): Promise<void> {
	if (workers.length > 0) return

	if (env.WHATSAPP_HABILITADO) {
		whatsappService.configurarLogger({
			info: (...a) => app.log.info({ src: 'whatsapp' }, a.map(String).join(' ')),
			warn: (...a) => app.log.warn({ src: 'whatsapp' }, a.map(String).join(' ')),
			error: (...a) => app.log.error({ src: 'whatsapp' }, a.map(String).join(' ')),
		})
		whatsappService.iniciar().catch((err) => app.log.error({ err }, 'Falha ao iniciar WhatsApp'))
	}

	const notificacoesWorker = iniciarNotificacoesWorker(app.prisma, app.log)
	workers.push(notificacoesWorker)
	app.log.info('🛠️  Worker de notificações iniciado')

	if (env.REGUA_HABILITADA) {
		const reguaWorker = await iniciarReguaWorker(app.prisma, app.log)
		workers.push(reguaWorker)
		app.log.info(`⏰ Worker da régua iniciado — cron: ${env.REGUA_CRON}`)
	}
}

export async function shutdownWorkers(): Promise<void> {
	await Promise.all(workers.map((w) => w.close()))
	workers = []
	await fecharFilas()
	await closeRedisConnection()
}
