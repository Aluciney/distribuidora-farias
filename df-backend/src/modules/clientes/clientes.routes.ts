import type { Cliente } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { erroSchema } from '../auth/auth.schemas'
import {
	alterarStatusClienteInputSchema,
	atualizarClienteInputSchema,
	clienteSchema,
	criarClienteInputSchema,
	listarClientesQuerySchema,
} from './clientes.schemas'
import { ClientesService } from './clientes.service'

export function serializarCliente(c: Cliente) {
	return {
		id: c.id,
		cnpj: c.cnpj,
		razaoSocial: c.razaoSocial,
		nomeFantasia: c.nomeFantasia,
		inscricaoEstadual: c.inscricaoEstadual,
		email: c.email,
		telefone: c.telefone,
		status: c.status,
		limiteCredito: c.limiteCredito,
		observacoes: c.observacoes,
		endereco: {
			cep: c.enderecoCep,
			logradouro: c.enderecoLogradouro,
			numero: c.enderecoNumero,
			complemento: c.enderecoComplemento,
			bairro: c.enderecoBairro,
			cidade: c.enderecoCidade,
			uf: c.enderecoUf,
		},
		criadoEm: c.criadoEm.toISOString(),
		atualizadoEm: c.atualizadoEm.toISOString(),
	}
}

export async function rotasClientes(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const service = new ClientesService(app.prisma)
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Clientes'],
				summary: 'Lista clientes (paginado)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: listarClientesQuerySchema,
				response: {
					200: z.object({
						itens: z.array(clienteSchema),
						total: z.number(),
						pagina: z.number(),
						porPagina: z.number(),
					}),
				},
			},
			preHandler: guard,
		},
		async (req) => {
			const { itens, total } = await service.listar(req.query)
			return {
				itens: itens.map(serializarCliente),
				total,
				pagina: req.query.pagina,
				porPagina: req.query.porPagina,
			}
		},
	)

	a.get(
		'/:id',
		{
			schema: {
				tags: ['Clientes'],
				summary: 'Obtém um cliente pelo ID',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 200: clienteSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializarCliente(await service.obter(req.params.id)),
	)

	a.post(
		'/',
		{
			schema: {
				tags: ['Clientes'],
				summary: 'Cria um cliente',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: criarClienteInputSchema,
				response: { 201: clienteSchema, 409: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req, reply) => {
			const c = await service.criar(req.body)
			return reply.status(201).send(serializarCliente(c))
		},
	)

	a.put(
		'/:id',
		{
			schema: {
				tags: ['Clientes'],
				summary: 'Atualiza um cliente (CNPJ imutável)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: atualizarClienteInputSchema,
				response: { 200: clienteSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializarCliente(await service.atualizar(req.params.id, req.body)),
	)

	a.patch(
		'/:id/status',
		{
			schema: {
				tags: ['Clientes'],
				summary: 'Altera o status do cliente',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: alterarStatusClienteInputSchema,
				response: { 200: clienteSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializarCliente(await service.alterarStatus(req.params.id, req.body.status)),
	)
}
