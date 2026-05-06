import type { PrismaClient } from '@prisma/client'
import { Worker } from 'bullmq'
import type { FastifyBaseLogger } from 'fastify'
import { env } from '../../env'
import { NotificacoesService } from '../../modules/notificacoes/notificacoes.service'
import {
	type DadosJobRegua,
	getFilaRegua,
	ID_JOB_REGUA_AGENDADO,
	NOME_FILA_REGUA,
} from '../filas'
import { getRedisConnection } from '../redis'

export async function iniciarReguaWorker(
	prisma: PrismaClient,
	logger: FastifyBaseLogger,
): Promise<Worker<DadosJobRegua>> {
	const fila = getFilaRegua()

	// Garante que existe um repeatable job no cron configurado.
	await fila.add(
		ID_JOB_REGUA_AGENDADO,
		{},
		{
			repeat: { pattern: env.REGUA_CRON },
			jobId: ID_JOB_REGUA_AGENDADO,
			removeOnComplete: { age: 60 * 60 * 24, count: 50 },
			removeOnFail: { age: 60 * 60 * 24 * 7 },
		},
	)

	const worker = new Worker<DadosJobRegua>(
		NOME_FILA_REGUA,
		async (job) => {
			const dataReferencia = job.data.dataReferencia ? new Date(job.data.dataReferencia) : undefined
			const service = new NotificacoesService(prisma, undefined, logger)
			const resultado = await service.enfileirarRegua({ regraId: job.data.regraId, dataReferencia })
			logger.info({ jobId: job.id, ...resultado }, '⏰ Régua varrida — notificações enfileiradas')
			return resultado
		},
		{
			connection: getRedisConnection(),
			concurrency: 1,
		},
	)

	worker.on('failed', (job, err) => {
		logger.error({ jobId: job?.id, err: err.message }, 'Falha ao varrer régua')
	})

	return worker
}
