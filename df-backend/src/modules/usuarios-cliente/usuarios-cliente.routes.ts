import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { erroSchema } from '../auth/auth.schemas'
import {
	atualizarUsuarioClienteInputSchema,
	criarUsuarioClienteInputSchema,
	listarUsuariosClienteQuerySchema,
	usuarioClienteSchema,
	vincularFilialInputSchema,
} from './usuarios-cliente.schemas'
import {
	UsuariosClienteService,
	type UsuarioClienteComFiliais,
} from './usuarios-cliente.service'

function serializar(u: UsuarioClienteComFiliais) {
	return {
		id: u.id,
		nome: u.nome,
		email: u.email,
		telefone: u.telefone,
		ativo: u.ativo,
		senhaDefinida: u.senhaHash !== null,
		ultimoAcesso: u.ultimoAcesso ? u.ultimoAcesso.toISOString() : null,
		criadoEm: u.criadoEm.toISOString(),
		filiais: u.acessos.map((a) => ({
			id: a.cliente.id,
			cnpj: a.cliente.cnpj,
			razaoSocial: a.cliente.razaoSocial,
			nomeFantasia: a.cliente.nomeFantasia,
			status: a.cliente.status,
			principal: a.principal,
			vinculadoEm: a.criadoEm.toISOString(),
		})),
	}
}

export async function rotasUsuariosCliente(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const service = new UsuariosClienteService(app.prisma)
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Usuários Cliente'],
				summary: 'Lista holdings/usuários cliente (paginado)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: listarUsuariosClienteQuerySchema,
				response: {
					200: z.object({
						itens: z.array(usuarioClienteSchema),
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
				itens: itens.map(serializar),
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
				tags: ['Usuários Cliente'],
				summary: 'Detalhe de um usuário cliente',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 200: usuarioClienteSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializar(await service.obter(req.params.id)),
	)

	a.post(
		'/',
		{
			schema: {
				tags: ['Usuários Cliente'],
				summary: 'Cria um usuário cliente e envia convite por email',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: criarUsuarioClienteInputSchema,
				response: { 201: usuarioClienteSchema, 404: erroSchema, 409: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req, reply) => {
			const u = await service.criar(req.body)
			return reply.status(201).send(serializar(u))
		},
	)

	a.patch(
		'/:id',
		{
			schema: {
				tags: ['Usuários Cliente'],
				summary: 'Atualiza dados do usuário cliente',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: atualizarUsuarioClienteInputSchema,
				response: { 200: usuarioClienteSchema, 404: erroSchema, 409: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializar(await service.atualizar(req.params.id, req.body)),
	)

	a.post(
		'/:id/reenviar-convite',
		{
			schema: {
				tags: ['Usuários Cliente'],
				summary: 'Reenvia o email de convite (apenas se senha ainda não foi definida)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: {
					200: z.object({ destinatario: z.string() }),
					404: erroSchema,
					422: erroSchema,
				},
			},
			preHandler: guard,
		},
		async (req) => service.reenviarConvite(req.params.id),
	)

	a.post(
		'/:id/filiais',
		{
			schema: {
				tags: ['Usuários Cliente'],
				summary: 'Vincula uma filial ao usuário cliente',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: vincularFilialInputSchema,
				response: { 200: usuarioClienteSchema, 404: erroSchema, 409: erroSchema },
			},
			preHandler: guard,
		},
		async (req) =>
			serializar(
				await service.vincularFilial(req.params.id, req.body.clienteId, req.body.principal),
			),
	)

	a.delete(
		'/:id/filiais/:clienteId',
		{
			schema: {
				tags: ['Usuários Cliente'],
				summary: 'Desvincula uma filial do usuário cliente',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid(), clienteId: z.string().uuid() }),
				response: { 200: usuarioClienteSchema, 404: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req) =>
			serializar(await service.desvincularFilial(req.params.id, req.params.clienteId)),
	)

	a.patch(
		'/:id/filiais/:clienteId/principal',
		{
			schema: {
				tags: ['Usuários Cliente'],
				summary: 'Define qual filial é a sede (principal) do usuário cliente',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid(), clienteId: z.string().uuid() }),
				response: { 200: usuarioClienteSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) =>
			serializar(await service.definirFilialPrincipal(req.params.id, req.params.clienteId)),
	)
}
