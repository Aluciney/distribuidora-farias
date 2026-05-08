import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { NaoEncontrado } from '../../shared/erros'
import { obterFiliaisDoUsuarioCliente } from '../../shared/tenancy'
import { erroSchema } from '../auth/auth.schemas'

const filialSchema = z.object({
	id: z.string(),
	cnpj: z.string(),
	razaoSocial: z.string(),
	nomeFantasia: z.string().nullable(),
	inscricaoEstadual: z.string().nullable(),
	status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']),
	endereco: z.object({
		cep: z.string(),
		logradouro: z.string(),
		numero: z.string(),
		complemento: z.string().nullable(),
		bairro: z.string(),
		cidade: z.string(),
		uf: z.string(),
	}),
	principal: z.boolean(),
})

const perfilSchema = z.object({
	id: z.string(),
	nome: z.string(),
	email: z.string(),
	telefone: z.string(),
	filiais: z.array(filialSchema),
})

const atualizarContatoInputSchema = z.object({
	nome: z.string().min(2).optional(),
	telefone: z
		.string()
		.transform((v) => v.replace(/\D/g, ''))
		.refine(
			(v) => v.length === 10 || v.length === 11,
			'Telefone deve ter 10 ou 11 dígitos (com DDD).',
		)
		.optional(),
})

export async function rotasClientePerfil(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerUsuarioCliente]

	a.get(
		'/',
		{
			schema: {
				tags: ['Portal do Cliente'],
				summary: 'Dados do UsuarioCliente logado e suas filiais',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: perfilSchema, 404: erroSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const usuario = await app.prisma.usuarioCliente.findUnique({
				where: { id: req.sessao.sub },
			})
			if (!usuario) throw new NaoEncontrado('UsuarioCliente', req.sessao.sub)
			const filiais = await obterFiliaisDoUsuarioCliente(app.prisma, usuario.id)
			return {
				id: usuario.id,
				nome: usuario.nome,
				email: usuario.email,
				telefone: usuario.telefone,
				filiais: filiais.map((c) => ({
					id: c.id,
					cnpj: c.cnpj,
					razaoSocial: c.razaoSocial,
					nomeFantasia: c.nomeFantasia,
					inscricaoEstadual: c.inscricaoEstadual,
					status: c.status,
					endereco: {
						cep: c.enderecoCep,
						logradouro: c.enderecoLogradouro,
						numero: c.enderecoNumero,
						complemento: c.enderecoComplemento,
						bairro: c.enderecoBairro,
						cidade: c.enderecoCidade,
						uf: c.enderecoUf,
					},
					principal: c.principal,
				})),
			}
		},
	)

	a.patch(
		'/contato',
		{
			schema: {
				tags: ['Portal do Cliente'],
				summary: 'Atualiza nome e/ou telefone do UsuarioCliente logado',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: atualizarContatoInputSchema,
				response: {
					200: z.object({
						id: z.string(),
						nome: z.string(),
						telefone: z.string(),
					}),
					404: erroSchema,
					422: erroSchema,
				},
			},
			preHandler: guard,
		},
		async (req) => {
			const atualizado = await app.prisma.usuarioCliente.update({
				where: { id: req.sessao.sub },
				data: {
					nome: req.body.nome,
					telefone: req.body.telefone,
				},
			})
			return { id: atualizado.id, nome: atualizado.nome, telefone: atualizado.telefone }
		},
	)
}
