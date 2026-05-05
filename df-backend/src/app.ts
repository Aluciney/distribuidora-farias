import { fastifyCookie } from '@fastify/cookie'
import { fastifyCors } from '@fastify/cors'
import { fastifyJwt } from '@fastify/jwt'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import { env } from './env'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'

export async function buildApp() {
	const app = fastify({ trustProxy: true })
	app.withTypeProvider<ZodTypeProvider>()
	app.setValidatorCompiler(validatorCompiler)
	app.setSerializerCompiler(serializerCompiler)
	app.register(fastifyCookie)
	app.register(fastifyCors, { origin: '*', methods: ['GET', 'PUT', 'POST', 'DELETE'] })
	app.register(fastifySwagger, {
		openapi: {
			info: {
				title: 'API',
				version: '1.0.0',
			},
			servers: [{ url: `http://localhost:${env.PORT}`, description: 'Servidor' }],
			components: {
				securitySchemes: {
					bearerAuth: {
						type: 'http',
						scheme: 'bearer',
						bearerFormat: 'JWT',
					},
				},
			},
		},
		transform: jsonSchemaTransform,
	})
	app.register(fastifySwaggerUi, { routePrefix: '/docs' })
	await app.ready()
	return app
}