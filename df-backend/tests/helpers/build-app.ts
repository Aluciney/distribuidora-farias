import { buildApp } from '../../src/app'

export async function construirApp() {
	const app = await buildApp()
	await app.ready()
	return app
}
