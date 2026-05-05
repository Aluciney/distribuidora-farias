import { construirApp } from '../helpers/build-app'
import { criarClienteSeed } from '../helpers/factories/cliente.factory'
import { criarUsuarioSeed } from '../helpers/factories/usuario.factory'
import { limparBanco } from '../helpers/limpar-banco'

describe('Auth', () => {
	let app: Awaited<ReturnType<typeof construirApp>>

	beforeAll(async () => {
		app = await construirApp()
	})
	afterAll(async () => {
		await app.close()
	})
	beforeEach(async () => {
		await limparBanco()
	})

	describe('POST /auth/login/admin', () => {
		it('autentica usuário admin e devolve cookie + token', async () => {
			await criarUsuarioSeed({ email: 'aluciney@df.com', senha: 'df2026' })

			const res = await app.inject({
				method: 'POST',
				url: '/auth/login/admin',
				payload: { email: 'aluciney@df.com', senha: 'df2026' },
			})

			expect(res.statusCode).toBe(200)
			expect(res.json()).toMatchObject({
				usuario: { email: 'aluciney@df.com' },
				token: expect.any(String),
			})
			expect(res.cookies.find((c) => c.name === 'df_session')).toBeDefined()
		})

		it('rejeita senha incorreta', async () => {
			await criarUsuarioSeed({ email: 'a@b.com', senha: 'df2026' })
			const res = await app.inject({
				method: 'POST',
				url: '/auth/login/admin',
				payload: { email: 'a@b.com', senha: 'errada' },
			})
			expect(res.statusCode).toBe(401)
			expect(res.json().erro).toBe('CREDENCIAIS_INVALIDAS')
		})

		it('rejeita usuário inativo', async () => {
			await criarUsuarioSeed({ email: 'a@b.com', senha: 'df2026', ativo: false })
			const res = await app.inject({
				method: 'POST',
				url: '/auth/login/admin',
				payload: { email: 'a@b.com', senha: 'df2026' },
			})
			expect(res.statusCode).toBe(403)
			expect(res.json().erro).toBe('USUARIO_INATIVO')
		})
	})

	describe('POST /auth/login/cliente', () => {
		it('autentica cliente e devolve cookie + token', async () => {
			await criarClienteSeed({ cnpj: '11444777000161', senha: 'df2026' })
			const res = await app.inject({
				method: 'POST',
				url: '/auth/login/cliente',
				payload: { cnpj: '11.444.777/0001-61', senha: 'df2026' },
			})
			expect(res.statusCode).toBe(200)
			expect(res.json().cliente.cnpj).toBe('11444777000161')
		})

		it('rejeita cliente bloqueado', async () => {
			await criarClienteSeed({ cnpj: '11444777000161', senha: 'df2026', status: 'BLOQUEADO' })
			const res = await app.inject({
				method: 'POST',
				url: '/auth/login/cliente',
				payload: { cnpj: '11444777000161', senha: 'df2026' },
			})
			expect(res.statusCode).toBe(403)
			expect(res.json().erro).toBe('CLIENTE_BLOQUEADO')
		})
	})
})
