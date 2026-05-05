import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import fp from 'fastify-plugin'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'
import { env } from '../env'

export const swaggerPlugin = fp(async (app) => {
	await app.register(fastifySwagger, {
		openapi: {
			info: {
				title: 'DF Pagamentos API',
				description: 'Backend do sistema de gestão de pagamentos da Distribuidora Farias.',
				version: '1.0.0',
			},
			servers: [{ url: `http://localhost:${env.PORT}`, description: 'Local' }],
			components: {
				securitySchemes: {
					cookieAuth: { type: 'apiKey', in: 'cookie', name: 'df_session' },
					bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
				},
			},
		},
		transform: jsonSchemaTransform,
	})

	await app.register(fastifySwaggerUi, {
		routePrefix: '/docs',
		uiConfig: { docExpansion: 'list', deepLinking: false },
	})
})
