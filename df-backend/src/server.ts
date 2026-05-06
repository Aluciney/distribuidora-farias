import { buildApp } from './app'
import { env } from './env'
import { bootstrapWorkers, shutdownWorkers } from './queues'

async function start() {
	const app = await buildApp()

	app.addHook('onClose', async () => {
		await shutdownWorkers()
	})

	try {
		await app.ready()
		await app.listen({ port: env.PORT, host: '0.0.0.0' })
		app.log.info(`✅ API rodando em http://localhost:${env.PORT}`)
		app.log.info(`📚 Docs em http://localhost:${env.PORT}/docs`)

		if (env.WORKERS_HABILITADOS) {
			await bootstrapWorkers(app)
		} else {
			app.log.info('⚠️  WORKERS_HABILITADOS=false — filas e WhatsApp não serão inicializados neste processo')
		}

		const fechar = async (signal: string) => {
			app.log.info({ signal }, 'Encerrando processo...')
			await app.close()
			process.exit(0)
		}
		process.once('SIGINT', () => fechar('SIGINT'))
		process.once('SIGTERM', () => fechar('SIGTERM'))
	} catch (err) {
		app.log.error(err)
		process.exit(1)
	}
}

start()
