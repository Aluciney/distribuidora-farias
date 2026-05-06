import type { Perfil, PrismaClient, Usuario } from '@prisma/client'
import { Conflito, NaoEncontrado, RegraNegocio } from '../../shared/erros'
import { hashearSenha } from '../../shared/utils/senha'

interface CriarInput {
	nome: string
	email: string
	perfil: Perfil
	senha?: string
	ativo?: boolean
}

interface AtualizarInput {
	nome?: string
	email?: string
	perfil?: Perfil
	ativo?: boolean
}

const SENHA_PADRAO_NOVO_USUARIO = 'df2026'

export class UsuariosService {
	constructor(private readonly prisma: PrismaClient) {}

	async listar(filtros: {
		busca?: string
		perfil?: Perfil
		ativo?: boolean
		pagina: number
		porPagina: number
	}): Promise<{ itens: Usuario[]; total: number }> {
		const where = {
			perfil: filtros.perfil,
			ativo: filtros.ativo,
			...(filtros.busca
				? {
						OR: [
							{ nome: { contains: filtros.busca, mode: 'insensitive' as const } },
							{ email: { contains: filtros.busca, mode: 'insensitive' as const } },
						],
					}
				: {}),
		}
		const [itens, total] = await Promise.all([
			this.prisma.usuario.findMany({
				where,
				orderBy: { nome: 'asc' },
				skip: (filtros.pagina - 1) * filtros.porPagina,
				take: filtros.porPagina,
			}),
			this.prisma.usuario.count({ where }),
		])
		return { itens, total }
	}

	async obter(id: string): Promise<Usuario> {
		const u = await this.prisma.usuario.findUnique({ where: { id } })
		if (!u) throw new NaoEncontrado('Usuário', id)
		return u
	}

	async criar(input: CriarInput): Promise<Usuario> {
		const emailNormalizado = input.email.toLowerCase()
		const existe = await this.prisma.usuario.findUnique({ where: { email: emailNormalizado } })
		if (existe) throw new Conflito('CONFLITO_EMAIL', 'Já existe um usuário com este email.')
		const senhaHash = await hashearSenha(input.senha ?? SENHA_PADRAO_NOVO_USUARIO)
		return this.prisma.usuario.create({
			data: {
				nome: input.nome,
				email: emailNormalizado,
				perfil: input.perfil,
				senhaHash,
				ativo: input.ativo ?? true,
			},
		})
	}

	async atualizar(id: string, input: AtualizarInput, sessaoId: string): Promise<Usuario> {
		const atual = await this.obter(id)

		if (id === sessaoId && input.perfil && input.perfil !== atual.perfil) {
			throw new RegraNegocio('AUTO_REBAIXAMENTO', 'Você não pode alterar seu próprio perfil.')
		}
		if (id === sessaoId && input.ativo === false) {
			throw new RegraNegocio('AUTO_DESATIVACAO', 'Você não pode desativar a si mesmo.')
		}

		if (input.email && input.email.toLowerCase() !== atual.email) {
			const conflito = await this.prisma.usuario.findUnique({ where: { email: input.email.toLowerCase() } })
			if (conflito) throw new Conflito('CONFLITO_EMAIL', 'Já existe um usuário com este email.')
		}

		return this.prisma.usuario.update({
			where: { id },
			data: {
				nome: input.nome,
				email: input.email?.toLowerCase(),
				perfil: input.perfil,
				ativo: input.ativo,
			},
		})
	}

	async alterarAtivo(id: string, ativo: boolean, sessaoId: string): Promise<Usuario> {
		if (id === sessaoId && !ativo) {
			throw new RegraNegocio('AUTO_DESATIVACAO', 'Você não pode desativar a si mesmo.')
		}
		await this.obter(id)
		return this.prisma.usuario.update({ where: { id }, data: { ativo } })
	}
}
