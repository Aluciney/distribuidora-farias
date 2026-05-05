import { construirApp } from '../helpers/build-app'

describe('GET /saude', () => {
	let app: Awaited<ReturnType<typeof construirApp>>

	beforeAll(async () => {
		app = await construirApp()
	})
	afterAll(async () => {
		await app.close()
	})

	it('retorna status ok', async () => {
		const res = await app.inject({ method: 'GET', url: '/saude' })
		expect(res.statusCode).toBe(200)
		expect(res.json().status).toBe('ok')
	})
})
