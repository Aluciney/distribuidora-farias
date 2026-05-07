import { fastifyCors } from '@fastify/cors'
import { fastify } from 'fastify'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { env } from './env'
import { rotasAuth } from './modules/auth/auth.routes'
import { rotasClientes } from './modules/clientes/clientes.routes'
import { rotasClientePerfil } from './modules/cliente-perfil/cliente-perfil.routes'
import { rotasPushCliente } from './modules/push/push.routes'
import { rotasCobrancasAdmin, rotasCobrancasCliente } from './modules/cobrancas/cobrancas.routes'
import { rotasConfiguracoes } from './modules/configuracoes/configuracoes.routes'
import { rotasDashboardCliente } from './modules/dashboard-cliente/dashboard-cliente.routes'
import { rotasFluxoCaixa } from './modules/fluxo-caixa/fluxo-caixa.routes'
import { rotasInadimplencia } from './modules/inadimplencia/inadimplencia.routes'
import { rotasNotificacoesAdmin, rotasNotificacoesCliente } from './modules/notificacoes/notificacoes.routes'
import { rotasPedidos } from './modules/pedidos/pedidos.routes'
import { rotasProdutos } from './modules/produtos/produtos.routes'
import { rotasRegras } from './modules/regras/regras.routes'
import { rotasUsuarios } from './modules/usuarios/usuarios.routes'
import { rotasWhatsapp } from './modules/whatsapp/whatsapp.routes'
import { authPlugin } from './plugins/auth.plugin'
import { errorHandlerPlugin } from './plugins/error-handler.plugin'
import { prismaPlugin } from './plugins/prisma.plugin'
import { swaggerPlugin } from './plugins/swagger.plugin'

export async function buildApp() {
	const app = fastify({
		trustProxy: true,
		logger: env.NODE_ENV === 'test' ? false : { level: env.LOG_LEVEL },
	}).withTypeProvider<ZodTypeProvider>()

	app.setValidatorCompiler(validatorCompiler)
	app.setSerializerCompiler(serializerCompiler)

	await app.register(errorHandlerPlugin)
	await app.register(fastifyCors, {
		origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	})
	await app.register(prismaPlugin)
	await app.register(authPlugin)
	await app.register(swaggerPlugin)

	app.get(
		'/saude',
		{
			schema: {
				tags: ['Sistema'],
				summary: 'Healthcheck',
				response: {
					200: z.object({ status: z.literal('ok'), timestamp: z.string() }),
				},
			},
		},
		async () => ({ status: 'ok' as const, timestamp: new Date().toISOString() }),
	)

	await app.register(rotasAuth, { prefix: '/auth' })
	await app.register(rotasUsuarios, { prefix: '/admin/usuarios' })
	await app.register(rotasClientes, { prefix: '/admin/clientes' })
	await app.register(rotasProdutos, { prefix: '/admin/produtos' })
	await app.register(rotasPedidos, { prefix: '/admin/pedidos' })
	await app.register(rotasConfiguracoes, { prefix: '/admin/configuracoes' })
	await app.register(rotasCobrancasAdmin, { prefix: '/admin/cobrancas' })
	await app.register(rotasInadimplencia, { prefix: '/admin/inadimplencia' })
	await app.register(rotasFluxoCaixa, { prefix: '/admin/fluxo-caixa' })
	await app.register(rotasRegras, { prefix: '/admin/regras' })
	await app.register(rotasNotificacoesAdmin, { prefix: '/admin/notificacoes' })
	await app.register(rotasWhatsapp, { prefix: '/admin/whatsapp' })

	await app.register(rotasCobrancasCliente, { prefix: '/cliente/faturas' })
	await app.register(rotasNotificacoesCliente, { prefix: '/cliente/notificacoes' })
	await app.register(rotasDashboardCliente, { prefix: '/cliente/dashboard' })
	await app.register(rotasClientePerfil, { prefix: '/cliente/perfil' })
	await app.register(rotasPushCliente, { prefix: '/cliente/push' })

	return app
}
