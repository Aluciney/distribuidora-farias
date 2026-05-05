import type { FastifyInstance } from 'fastify'
import cron, { type ScheduledTask } from 'node-cron'
import { env } from '../../env'
import { NotificacoesService } from './notificacoes.service'

let task: ScheduledTask | null = null

export function iniciarReguaWorker(app: FastifyInstance): void {
	if (task) return
	const service = new NotificacoesService(app.prisma)
	task = cron.schedule(env.REGUA_CRON, async () => {
		try {
			const r = await service.executarRegua()
			app.log.info({ ...r }, '⏰ Régua executada')
		} catch (err) {
			app.log.error({ err }, 'Erro na execução da régua')
		}
	})
}

export function pararReguaWorker(): void {
	if (task) {
		task.stop()
		task = null
	}
}
