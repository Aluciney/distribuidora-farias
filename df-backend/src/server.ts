import { buildApp } from './app'
import { env } from './env'
import { iniciarReguaWorker } from './modules/notificacoes/regua.worker'

async function start() {
	const app = await buildApp()
	try {
		await app.ready()
		await app.listen({ port: env.PORT, host: '0.0.0.0' })
		app.log.info(`✅ API rodando em http://localhost:${env.PORT}`)
		app.log.info(`📚 Docs em http://localhost:${env.PORT}/docs`)

		if (env.REGUA_HABILITADA) {
			iniciarReguaWorker(app)
			app.log.info(`⏰ Régua habilitada — cron: ${env.REGUA_CRON}`)
		}
	} catch (err) {
		app.log.error(err)
		process.exit(1)
	}
}

start()
