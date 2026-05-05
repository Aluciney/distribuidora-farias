import type { AcaoRegua, RegraCobranca } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { NaoEncontrado } from '../../shared/erros'
import { erroSchema } from '../auth/auth.schemas'
import { regraInputSchema, regraSchema } from './regras.schemas'

function serializar(regra: RegraCobranca & { acoes: AcaoRegua[] }) {
	return {
		id: regra.id,
		nome: regra.nome,
		descricao: regra.descricao,
		ativo: regra.ativo,
		gatilho: regra.gatilho,
		diasOffset: regra.diasOffset,
		acoes: regra.acoes.map((a) => ({ id: a.id, canal: a.canal, assunto: a.assunto, mensagem: a.mensagem })),
		criadoEm: regra.criadoEm.toISOString(),
		atualizadoEm: regra.atualizadoEm.toISOString(),
	}
}

export async function rotasRegras(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Régua'],
				summary: 'Lista regras de cobrança',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: z.object({ itens: z.array(regraSchema) }) },
			},
			preHandler: guard,
		},
		async () => {
			const regras = await app.prisma.regraCobranca.findMany({
				orderBy: { diasOffset: 'asc' },
				include: { acoes: true },
			})
			return { itens: regras.map(serializar) }
		},
	)

	a.post(
		'/',
		{
			schema: {
				tags: ['Régua'],
				summary: 'Cria uma regra de cobrança',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: regraInputSchema,
				response: { 201: regraSchema },
			},
			preHandler: guard,
		},
		async (req, reply) => {
			const regra = await app.prisma.regraCobranca.create({
				data: {
					nome: req.body.nome,
					descricao: req.body.descricao ?? null,
					ativo: req.body.ativo,
					gatilho: req.body.gatilho,
					diasOffset: req.body.diasOffset,
					acoes: { create: req.body.acoes.map((acao) => ({ canal: acao.canal, assunto: acao.assunto ?? null, mensagem: acao.mensagem })) },
				},
				include: { acoes: true },
			})
			return reply.status(201).send(serializar(regra))
		},
	)

	a.put(
		'/:id',
		{
			schema: {
				tags: ['Régua'],
				summary: 'Atualiza regra (substitui ações)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: regraInputSchema,
				response: { 200: regraSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const exists = await app.prisma.regraCobranca.findUnique({ where: { id: req.params.id } })
			if (!exists) throw new NaoEncontrado('Regra', req.params.id)

			await app.prisma.acaoRegua.deleteMany({ where: { regraId: req.params.id } })
			const regra = await app.prisma.regraCobranca.update({
				where: { id: req.params.id },
				data: {
					nome: req.body.nome,
					descricao: req.body.descricao ?? null,
					ativo: req.body.ativo,
					gatilho: req.body.gatilho,
					diasOffset: req.body.diasOffset,
					acoes: { create: req.body.acoes.map((acao) => ({ canal: acao.canal, assunto: acao.assunto ?? null, mensagem: acao.mensagem })) },
				},
				include: { acoes: true },
			})
			return serializar(regra)
		},
	)

	a.patch(
		'/:id/ativo',
		{
			schema: {
				tags: ['Régua'],
				summary: 'Ativa/desativa regra',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				body: z.object({ ativo: z.boolean() }),
				response: { 200: regraSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const exists = await app.prisma.regraCobranca.findUnique({ where: { id: req.params.id } })
			if (!exists) throw new NaoEncontrado('Regra', req.params.id)
			const regra = await app.prisma.regraCobranca.update({
				where: { id: req.params.id },
				data: { ativo: req.body.ativo },
				include: { acoes: true },
			})
			return serializar(regra)
		},
	)

	a.delete(
		'/:id',
		{
			schema: {
				tags: ['Régua'],
				summary: 'Exclui regra (cascata em ações)',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				params: z.object({ id: z.string().uuid() }),
				response: { 204: z.null(), 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req, reply) => {
			const exists = await app.prisma.regraCobranca.findUnique({ where: { id: req.params.id } })
			if (!exists) throw new NaoEncontrado('Regra', req.params.id)
			await app.prisma.regraCobranca.delete({ where: { id: req.params.id } })
			return reply.status(204).send(null)
		},
	)
}
