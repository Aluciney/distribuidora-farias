import type { Cliente, PrismaClient, UsuarioCliente, UsuarioClienteAcesso } from '@prisma/client'
import { Conflito, NaoEncontrado, RegraNegocio } from '../../shared/erros'
import { AuthService } from '../auth/auth.service'

export type UsuarioClienteComFiliais = UsuarioCliente & {
	acessos: (UsuarioClienteAcesso & { cliente: Cliente })[]
}

interface CriarInput {
	nome: string
	email: string
	telefone: string
	/** Pelo menos uma filial deve ser vinculada — ID que será marcado como `principal`. */
	filialPrincipalId: string
	filiaisIds?: string[]
	/** Se true, dispara email de convite logo após criar. Default: true. */
	enviarConvite?: boolean
}

interface AtualizarInput {
	nome?: string
	email?: string
	telefone?: string
	ativo?: boolean
}

export class UsuariosClienteService {
	private auth: AuthService

	constructor(private readonly prisma: PrismaClient) {
		this.auth = new AuthService(prisma)
	}

	async listar(filtros: {
		busca?: string
		ativo?: boolean
		pagina: number
		porPagina: number
	}): Promise<{ itens: UsuarioClienteComFiliais[]; total: number }> {
		const where = {
			ativo: filtros.ativo,
			...(filtros.busca
				? {
						OR: [
							{ nome: { contains: filtros.busca, mode: 'insensitive' as const } },
							{ email: { contains: filtros.busca, mode: 'insensitive' as const } },
							{ telefone: { contains: filtros.busca.replace(/\D/g, '') } },
						],
					}
				: {}),
		}
		const [itens, total] = await Promise.all([
			this.prisma.usuarioCliente.findMany({
				where,
				include: { acessos: { include: { cliente: true } } },
				orderBy: { nome: 'asc' },
				skip: (filtros.pagina - 1) * filtros.porPagina,
				take: filtros.porPagina,
			}),
			this.prisma.usuarioCliente.count({ where }),
		])
		return { itens, total }
	}

	async obter(id: string): Promise<UsuarioClienteComFiliais> {
		const u = await this.prisma.usuarioCliente.findUnique({
			where: { id },
			include: { acessos: { include: { cliente: true } } },
		})
		if (!u) throw new NaoEncontrado('UsuarioCliente', id)
		return u
	}

	async criar(input: CriarInput): Promise<UsuarioClienteComFiliais> {
		const email = input.email.trim().toLowerCase()
		const conflito = await this.prisma.usuarioCliente.findUnique({ where: { email } })
		if (conflito) {
			throw new Conflito('CONFLITO_EMAIL', 'Já existe um UsuarioCliente com este email.')
		}

		const filiaisUnicas = Array.from(
			new Set([input.filialPrincipalId, ...(input.filiaisIds ?? [])]),
		)
		if (filiaisUnicas.length === 0) {
			throw new RegraNegocio('SEM_FILIAIS', 'Vincule ao menos uma filial ao usuário cliente.')
		}
		const existentes = await this.prisma.cliente.findMany({
			where: { id: { in: filiaisUnicas } },
			select: { id: true },
		})
		if (existentes.length !== filiaisUnicas.length) {
			throw new NaoEncontrado('Cliente', filiaisUnicas.find(
				(id) => !existentes.find((c) => c.id === id),
			) ?? '')
		}

		const criado = await this.prisma.usuarioCliente.create({
			data: {
				nome: input.nome,
				email,
				telefone: input.telefone,
				ativo: true,
				acessos: {
					create: filiaisUnicas.map((clienteId) => ({
						clienteId,
						principal: clienteId === input.filialPrincipalId,
					})),
				},
			},
			include: { acessos: { include: { cliente: true } } },
		})

		if (input.enviarConvite !== false) {
			// Convite é fire-and-forget aqui: se SMTP falhar, o admin pode usar
			// o endpoint de reenvio. Não derruba a criação por causa disso.
			await this.auth.enviarConviteSenhaInicial(criado.id).catch((err) => {
				console.warn('[usuarios-cliente] falha ao enviar convite:', err)
			})
		}

		return criado
	}

	async atualizar(id: string, input: AtualizarInput): Promise<UsuarioClienteComFiliais> {
		await this.obter(id)
		if (input.email) {
			const email = input.email.trim().toLowerCase()
			const conflito = await this.prisma.usuarioCliente.findFirst({
				where: { email, NOT: { id } },
				select: { id: true },
			})
			if (conflito) {
				throw new Conflito('CONFLITO_EMAIL', 'Outro UsuarioCliente já usa este email.')
			}
		}
		await this.prisma.usuarioCliente.update({
			where: { id },
			data: {
				nome: input.nome,
				email: input.email ? input.email.trim().toLowerCase() : undefined,
				telefone: input.telefone,
				ativo: input.ativo,
			},
		})
		return this.obter(id)
	}

	async reenviarConvite(id: string): Promise<{ destinatario: string }> {
		const u = await this.obter(id)
		if (u.senhaHash) {
			throw new RegraNegocio(
				'SENHA_JA_DEFINIDA',
				'Usuário já definiu senha. Use recuperação de senha em vez de convite.',
			)
		}
		return this.auth.enviarConviteSenhaInicial(id)
	}

	async vincularFilial(
		id: string,
		clienteId: string,
		principal = false,
	): Promise<UsuarioClienteComFiliais> {
		await this.obter(id)
		const cliente = await this.prisma.cliente.findUnique({ where: { id: clienteId } })
		if (!cliente) throw new NaoEncontrado('Cliente', clienteId)
		const ja = await this.prisma.usuarioClienteAcesso.findUnique({
			where: { usuarioClienteId_clienteId: { usuarioClienteId: id, clienteId } },
		})
		if (ja) {
			throw new Conflito('CONFLITO_VINCULO', 'Esta filial já está vinculada ao usuário.')
		}
		await this.prisma.$transaction(async (tx) => {
			if (principal) {
				await tx.usuarioClienteAcesso.updateMany({
					where: { usuarioClienteId: id, principal: true },
					data: { principal: false },
				})
			}
			await tx.usuarioClienteAcesso.create({
				data: { usuarioClienteId: id, clienteId, principal },
			})
		})
		return this.obter(id)
	}

	async desvincularFilial(id: string, clienteId: string): Promise<UsuarioClienteComFiliais> {
		const u = await this.obter(id)
		const acesso = u.acessos.find((a) => a.clienteId === clienteId)
		if (!acesso) throw new NaoEncontrado('UsuarioClienteAcesso', `${id}/${clienteId}`)
		if (u.acessos.length === 1) {
			throw new RegraNegocio(
				'ULTIMA_FILIAL',
				'Não é possível desvincular a única filial — desative o usuário ou vincule outra antes.',
			)
		}
		await this.prisma.$transaction(async (tx) => {
			await tx.usuarioClienteAcesso.delete({ where: { id: acesso.id } })
			// Se a filial removida era a principal, promove qualquer outra à principal.
			if (acesso.principal) {
				const outra = u.acessos.find((a) => a.clienteId !== clienteId)
				if (outra) {
					await tx.usuarioClienteAcesso.update({
						where: { id: outra.id },
						data: { principal: true },
					})
				}
			}
		})
		return this.obter(id)
	}

	async definirFilialPrincipal(id: string, clienteId: string): Promise<UsuarioClienteComFiliais> {
		const u = await this.obter(id)
		const alvo = u.acessos.find((a) => a.clienteId === clienteId)
		if (!alvo) throw new NaoEncontrado('UsuarioClienteAcesso', `${id}/${clienteId}`)
		if (alvo.principal) return u
		await this.prisma.$transaction([
			this.prisma.usuarioClienteAcesso.updateMany({
				where: { usuarioClienteId: id, principal: true },
				data: { principal: false },
			}),
			this.prisma.usuarioClienteAcesso.update({
				where: { id: alvo.id },
				data: { principal: true },
			}),
		])
		return this.obter(id)
	}
}
