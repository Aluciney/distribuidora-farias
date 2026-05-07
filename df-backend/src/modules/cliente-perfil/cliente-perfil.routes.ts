import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { erroSchema } from '../auth/auth.schemas'
import { NaoEncontrado } from '../../shared/erros'
import { serializarCliente } from '../clientes/clientes.routes'

const perfilSchema = z.object({
	id: z.string(),
	cnpj: z.string(),
	razaoSocial: z.string(),
	nomeFantasia: z.string().nullable(),
	email: z.string(),
	telefone: z.string(),
})

const atualizarTelefoneInputSchema = z.object({
	telefone: z
		.string()
		.transform((v) => v.replace(/\D/g, ''))
		.refine(
			(v) => v.length === 10 || v.length === 11,
			'Telefone deve ter 10 ou 11 dígitos (com DDD).',
		),
})

export async function rotasClientePerfil(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerCliente]

	a.get(
		'/',
		{
			schema: {
				tags: ['Portal do Cliente'],
				summary: 'Dados do cliente logado',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: perfilSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const cliente = await app.prisma.cliente.findUnique({
				where: { id: req.sessao.sub },
			})
			if (!cliente) throw new NaoEncontrado('Cliente', req.sessao.sub)
			return {
				id: cliente.id,
				cnpj: cliente.cnpj,
				razaoSocial: cliente.razaoSocial,
				nomeFantasia: cliente.nomeFantasia,
				email: cliente.email,
				telefone: cliente.telefone,
			}
		},
	)

	a.patch(
		'/telefone',
		{
			schema: {
				tags: ['Portal do Cliente'],
				summary: 'Cliente atualiza o próprio telefone',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: atualizarTelefoneInputSchema,
				response: {
					200: z
						.object({ telefone: z.string() })
						.merge(perfilSchema.pick({ id: true })),
					404: erroSchema,
					422: erroSchema,
				},
			},
			preHandler: guard,
		},
		async (req) => {
			const atualizado = await app.prisma.cliente.update({
				where: { id: req.sessao.sub },
				data: { telefone: req.body.telefone },
			})
			return { id: atualizado.id, telefone: atualizado.telefone }
		},
	)

	// Mantém o serializador alinhado com a rota admin para futuras adições.
	void serializarCliente
}
