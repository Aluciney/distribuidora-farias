import type { PrismaClient } from '@prisma/client'
import { Worker } from 'bullmq'
import type { FastifyBaseLogger } from 'fastify'
import { NotificacoesService } from '../../modules/notificacoes/notificacoes.service'
import { type DadosJobNotificacao, NOME_FILA_NOTIFICACOES } from '../filas'
import { getRedisConnection } from '../redis'

export function iniciarNotificacoesWorker(
	prisma: PrismaClient,
	logger: FastifyBaseLogger,
): Worker<DadosJobNotificacao> {
	const service = new NotificacoesService(prisma)

	const worker = new Worker<DadosJobNotificacao>(
		NOME_FILA_NOTIFICACOES,
		async (job) => {
			logger.info(
				{ jobId: job.id, canal: job.data.canal, destinatario: job.data.destinatario, attempt: job.attemptsMade + 1 },
				'▶️  Disparando notificação',
			)
			await service.disparar(job.data)
		},
		{
			connection: getRedisConnection(),
			concurrency: 5,
			limiter: {
				// Conservador no WhatsApp: até 30 mensagens por minuto.
				max: 30,
				duration: 60_000,
			},
		},
	)

	worker.on('ready', () => {
		logger.info('🛠️  Worker de notificações pronto e aguardando jobs')
	})

	worker.on('completed', (job) => {
		logger.info(
			{ jobId: job.id, canal: job.data.canal, faturaId: job.data.faturaId },
			'📨 Notificação enviada',
		)
	})

	worker.on('failed', (job, err) => {
		logger.warn(
			{ jobId: job?.id, canal: job?.data.canal, faturaId: job?.data.faturaId, attempts: job?.attemptsMade, err: err.message },
			'Falha ao enviar notificação',
		)
	})

	worker.on('error', (err) => {
		logger.error({ err: err.message }, 'Erro interno do worker de notificações')
	})

	return worker
}
