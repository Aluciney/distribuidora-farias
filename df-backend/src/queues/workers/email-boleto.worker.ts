import type { PrismaClient } from '@prisma/client'
import { Worker } from 'bullmq'
import type { FastifyBaseLogger } from 'fastify'
import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../../env'
import { gerarBoletoPdf } from '../../modules/cobrancas/boleto.pdf'
import { MENSAGEM_BOLETO_PADRAO, montarMensagem } from '../../modules/cobrancas/cobrancas.service'
import { type DadosJobEmailBoleto, NOME_FILA_EMAIL_BOLETO } from '../filas'
import { getRedisConnection } from '../redis'

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

export function iniciarEmailBoletoWorker(prisma: PrismaClient, logger: FastifyBaseLogger): Worker<DadosJobEmailBoleto> {
	const worker = new Worker<DadosJobEmailBoleto>(
		NOME_FILA_EMAIL_BOLETO,
		async (job) => {
			logger.info(
				{
					jobId: job.id,
					faturaId: job.data.faturaId,
					destinatario: job.data.destinatario,
					attempt: job.attemptsMade + 1,
				},
				'▶️  Enviando boleto via e-mail',
			)

			const from = env.SMTP_FROM ?? env.SMTP_USER
			if (!from) {
				throw new Error('SMTP_FROM (ou SMTP_USER) não configurado.')
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
			const mensagem = montarMensagem(config.whatsappMensagemBoleto ?? MENSAGEM_BOLETO_PADRAO, fatura, fatura.cliente)

			const transporter = getTransporter()
			await transporter.sendMail({
				from,
				to: job.data.destinatario,
				subject: `Boleto da fatura ${fatura.numero}`,
				text: mensagem,
				html: mensagem.replace(/\n/g, '<br/>'),
				attachments: [
					{
						filename: `boleto-${fatura.numero}.pdf`,
						content: pdf,
						contentType: 'application/pdf',
					},
				],
			})
		},
		{
			connection: getRedisConnection(),
			concurrency: 3,
			limiter: {
				max: 30,
				duration: 60_000,
			},
		},
	)

	worker.on('ready', () => {
		logger.info('🛠️  Worker de e-mail (boleto) pronto e aguardando jobs')
	})

	worker.on('completed', (job) => {
		logger.info({ jobId: job.id, faturaId: job.data.faturaId }, '📧 Boleto entregue por e-mail')
	})

	worker.on('failed', (job, err) => {
		logger.warn(
			{
				jobId: job?.id,
				faturaId: job?.data.faturaId,
				attempts: job?.attemptsMade,
				err: err.message,
			},
			'Falha ao enviar boleto por e-mail',
		)
	})

	worker.on('error', (err) => {
		logger.error({ err: err.message }, 'Erro interno do worker de e-mail (boleto)')
	})

	return worker
}
