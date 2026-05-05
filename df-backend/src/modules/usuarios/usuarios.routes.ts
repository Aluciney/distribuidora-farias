import type { Usuario } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { erroSchema } from '../auth/auth.schemas'
import {
	atualizarUsuarioInputSchema,
	criarUsuarioInputSchema,
	listarUsuariosQuerySchema,
	toggleAtivoInputSchema,
	usuarioSchema,
} from './usuarios.schemas'
import { UsuariosService } from './usuarios.service'

export async function rotasUsuarios(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const service = new UsuariosService(app.prisma)
	const guard = [app.requerPerfilAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Usuários'],
				summary: 'Lista usuários internos',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				querystring: listarUsuariosQuerySchema,
				response: { 200: z.object({ itens: z.array(usuarioSchema) }) },
			},
			preHandler: guard,
		},
		async (req) => {
			const itens = await service.listar(req.query)
			return { itens: itens.map(serializar) }
		},
	)

	a.get(
		'/:id',
		{
			schema: {
				tags: ['Usuários'],
				summary: 'Obtém um usuário pelo ID',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 200: usuarioSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializar(await service.obter(req.params.id)),
	)

	a.post(
		'/',
		{
			schema: {
				tags: ['Usuários'],
				summary: 'Cria um usuário interno',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: criarUsuarioInputSchema,
				response: { 201: usuarioSchema, 409: erroSchema },
			},
			preHandler: guard,
		},
		async (req, reply) => {
			const u = await service.criar(req.body)
			return reply.status(201).send(serializar(u))
		},
	)

	a.put(
		'/:id',
		{
			schema: {
				tags: ['Usuários'],
				summary: 'Atualiza um usuário',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: atualizarUsuarioInputSchema,
				response: { 200: usuarioSchema, 404: erroSchema, 409: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializar(await service.atualizar(req.params.id, req.body, req.sessao.sub)),
	)

	a.patch(
		'/:id/ativo',
		{
			schema: {
				tags: ['Usuários'],
				summary: 'Ativa ou desativa um usuário',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: toggleAtivoInputSchema,
				response: { 200: usuarioSchema, 404: erroSchema, 422: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => serializar(await service.alterarAtivo(req.params.id, req.body.ativo, req.sessao.sub)),
	)
}

function serializar(u: Usuario) {
	return {
		id: u.id,
		nome: u.nome,
		email: u.email,
		perfil: u.perfil,
		ativo: u.ativo,
		ultimoAcesso: u.ultimoAcesso ? u.ultimoAcesso.toISOString() : null,
		criadoEm: u.criadoEm.toISOString(),
		atualizadoEm: u.atualizadoEm.toISOString(),
	}
}
