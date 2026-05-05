import fp from 'fastify-plugin'
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod'
import { ZodError } from 'zod'
import { ErroDeDominio } from '../shared/erros'

export const errorHandlerPlugin = fp(async (app) => {
	app.setErrorHandler((err, _req, reply) => {
		if (hasZodFastifySchemaValidationErrors(err)) {
			return reply.status(400).send({
				erro: 'VALIDACAO',
				mensagem: 'Dados inválidos.',
				detalhes: err.validation,
			})
		}

		if (isResponseSerializationError(err)) {
			app.log.error({ err }, 'Resposta inválida ao serializar')
			return reply.status(500).send({
				erro: 'SERIALIZACAO',
				mensagem: 'Erro ao serializar resposta.',
			})
		}

		if (err instanceof ZodError) {
			return reply.status(400).send({
				erro: 'VALIDACAO',
				mensagem: 'Dados inválidos.',
				detalhes: err.flatten().fieldErrors,
			})
		}

		if (err instanceof ErroDeDominio) {
			return reply.status(err.statusCode).send({
				erro: err.codigo,
				mensagem: err.message,
				detalhes: err.detalhes,
			})
		}

		// JWT errors do @fastify/jwt
		const codigoErro = (err as { code?: unknown }).code
		if (typeof codigoErro === 'string' && codigoErro.startsWith('FST_JWT_')) {
			return reply.status(401).send({
				erro: 'TOKEN_INVALIDO',
				mensagem: 'Sessão inválida ou expirada.',
			})
		}

		app.log.error({ err }, 'Erro inesperado')
		return reply.status(500).send({
			erro: 'INTERNO',
			mensagem: 'Erro interno do servidor.',
		})
	})
})
