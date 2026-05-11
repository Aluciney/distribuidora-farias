import type { PrismaClient } from '@prisma/client'
import { Worker } from 'bullmq'
import type { FastifyBaseLogger } from 'fastify'
import { gerarBoletoPdf } from '../../modules/cobrancas/boleto.pdf'
import {
	MENSAGEM_BOLETO_PADRAO,
	montarMensagem,
} from '../../modules/cobrancas/cobrancas.service'
import { whatsappService } from '../../modules/whatsapp/whatsapp.service'
import { type DadosJobWhatsappBoleto, NOME_FILA_WHATSAPP_BOLETO } from '../filas'
import { getRedisConnection } from '../redis'

export function iniciarWhatsappBoletoWorker(
	prisma: PrismaClient,
	logger: FastifyBaseLogger,
): Worker<DadosJobWhatsappBoleto> {
	const worker = new Worker<DadosJobWhatsappBoleto>(
		NOME_FILA_WHATSAPP_BOLETO,
		async (job) => {
			logger.info(
				{
					jobId: job.id,
					faturaId: job.data.faturaId,
					destinatario: job.data.destinatario,
					attempt: job.attemptsMade + 1,
				},
				'▶️  Enviando boleto via WhatsApp',
			)

			if (!whatsappService.estaConectado()) {
				// Lança para o BullMQ aplicar backoff exponencial — quando o
				// admin reescanear o QR, as próximas tentativas funcionam.
				throw new Error(
					'WhatsApp não está conectado. Reconecte em Configurações → WhatsApp.',
				)
			}

			const fatura = await prisma.fatura.findUnique({
				where: { id: job.data.faturaId },
				include: { cliente: true },
			})
			if (!fatura || !fatura.cliente) {
				throw new Error(`Fatura ${job.data.faturaId} não encontrada.`)
			}
			const config = await prisma.configuracoesCobranca.findUnique({
				where: { id: 'unica' },
			})
			if (!config) {
				throw new Error('Configurações de cobrança não encontradas.')
			}

			const pdf = await gerarBoletoPdf({ fatura, cliente: fatura.cliente, config })
			const mensagem = montarMensagem(
				config.whatsappMensagemBoleto ?? MENSAGEM_BOLETO_PADRAO,
				fatura,
				fatura.cliente,
			)

			await whatsappService.enviarDocumento(
				job.data.destinatario,
				{
					buffer: pdf,
					nomeArquivo: `boleto-${fatura.numero}.pdf`,
					mimetype: 'application/pdf',
				},
				mensagem,
			)
		},
		{
			connection: getRedisConnection(),
			// Um único socket Baileys: serializa os envios para evitar
			// concorrência e respeitar o aquecimento de sessão entre mensagens.
			concurrency: 1,
			limiter: {
				// Conservador para reduzir risco de ban: até 20 boletos/min.
				max: 20,
				duration: 60_000,
			},
		},
	)

	worker.on('ready', () => {
		logger.info('🛠️  Worker de WhatsApp (boleto) pronto e aguardando jobs')
	})

	worker.on('completed', (job) => {
		logger.info(
			{ jobId: job.id, faturaId: job.data.faturaId },
			'📨 Boleto entregue ao WhatsApp',
		)
	})

	worker.on('failed', (job, err) => {
		logger.warn(
			{
				jobId: job?.id,
				faturaId: job?.data.faturaId,
				attempts: job?.attemptsMade,
				err: err.message,
			},
			'Falha ao enviar boleto via WhatsApp',
		)
	})

	worker.on('error', (err) => {
		logger.error({ err: err.message }, 'Erro interno do worker de WhatsApp (boleto)')
	})

	return worker
}
