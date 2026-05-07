import { randomInt } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { NaoAutorizado, Proibido, RegraNegocio } from '../../shared/erros'
import { apenasDigitosCnpj } from '../../shared/utils/cnpj'
import { hashearSenha, validarSenha } from '../../shared/utils/senha'
import type { ICanalNotificacao } from '../notificacoes/canais/canal.interface'
import { EmailCanalLog, EmailCanalSmtp } from '../notificacoes/canais/email.canal'

const VALIDADE_CODIGO_MINUTOS = 15
const SENHA_MINIMO = 6

export type TipoEntidade = 'ADMIN' | 'CLIENTE'

interface AlterarSenhaInput {
	tipo: TipoEntidade
	entidadeId: string
	senhaAtual: string
	senhaNova: string
}

interface SolicitarRecuperacaoInput {
	tipo: TipoEntidade
	/** Email para ADMIN, CNPJ para CLIENTE. */
	identificador: string
}

interface RedefinirSenhaInput {
	tipo: TipoEntidade
	identificador: string
	codigo: string
	senhaNova: string
}

export class AuthService {
	private email: ICanalNotificacao

	constructor(private readonly prisma: PrismaClient, email?: ICanalNotificacao) {
		this.email = email ?? defaultCanalEmail()
	}

	async loginAdmin(email: string, senha: string) {
		const usuario = await this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } })
		if (!usuario || !(await validarSenha(senha, usuario.senhaHash))) {
			throw new NaoAutorizado('CREDENCIAIS_INVALIDAS', 'Email ou senha incorretos.')
		}
		if (!usuario.ativo) throw new Proibido('USUARIO_INATIVO', 'Usuário inativo.')
		await this.prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } })
		return usuario
	}

	async loginCliente(cnpj: string, senha: string) {
		const cnpjDigitos = apenasDigitosCnpj(cnpj)
		const cliente = await this.prisma.cliente.findUnique({ where: { cnpj: cnpjDigitos } })
		if (!cliente || !cliente.senhaHash || !(await validarSenha(senha, cliente.senhaHash))) {
			throw new NaoAutorizado('CREDENCIAIS_INVALIDAS', 'CNPJ ou senha incorretos.')
		}
		if (cliente.status === 'INATIVO') throw new Proibido('CLIENTE_INATIVO', 'Cliente inativo.')
		if (cliente.status === 'BLOQUEADO') throw new Proibido('CLIENTE_BLOQUEADO', 'Cliente bloqueado.')
		await this.prisma.cliente.update({ where: { id: cliente.id }, data: { ultimoAcesso: new Date() } })
		return cliente
	}

	async definirSenhaCliente(cnpj: string, senha: string) {
		const cnpjDigitos = apenasDigitosCnpj(cnpj)
		const cliente = await this.prisma.cliente.findUnique({ where: { cnpj: cnpjDigitos } })
		if (!cliente) throw new RegraNegocio('CLIENTE_NAO_ENCONTRADO', 'Cliente não encontrado.')
		if (cliente.senhaHash) {
			throw new RegraNegocio('SENHA_JA_DEFINIDA', 'Cliente já possui senha cadastrada. Use a tela de recuperação.')
		}
		await this.prisma.cliente.update({
			where: { id: cliente.id },
			data: { senhaHash: await hashearSenha(senha) },
		})
	}

	async obterUsuario(id: string) {
		return this.prisma.usuario.findUnique({ where: { id } })
	}

	async obterCliente(id: string) {
		return this.prisma.cliente.findUnique({ where: { id } })
	}

	// -------------------------------------------------------------------------
	// Alterar senha (autenticado)
	// -------------------------------------------------------------------------

	async alterarSenha(input: AlterarSenhaInput): Promise<void> {
		validarComprimentoSenha(input.senhaNova)
		if (input.senhaAtual === input.senhaNova) {
			throw new RegraNegocio('SENHA_IGUAL', 'A nova senha deve ser diferente da atual.')
		}

		if (input.tipo === 'ADMIN') {
			const usuario = await this.prisma.usuario.findUnique({ where: { id: input.entidadeId } })
			if (!usuario) throw new NaoAutorizado()
			if (!(await validarSenha(input.senhaAtual, usuario.senhaHash))) {
				throw new NaoAutorizado('SENHA_ATUAL_INVALIDA', 'Senha atual incorreta.')
			}
			await this.prisma.usuario.update({
				where: { id: usuario.id },
				data: { senhaHash: await hashearSenha(input.senhaNova) },
			})
			return
		}

		const cliente = await this.prisma.cliente.findUnique({ where: { id: input.entidadeId } })
		if (!cliente) throw new NaoAutorizado()
		if (!cliente.senhaHash || !(await validarSenha(input.senhaAtual, cliente.senhaHash))) {
			throw new NaoAutorizado('SENHA_ATUAL_INVALIDA', 'Senha atual incorreta.')
		}
		await this.prisma.cliente.update({
			where: { id: cliente.id },
			data: { senhaHash: await hashearSenha(input.senhaNova) },
		})
	}

	// -------------------------------------------------------------------------
	// Recuperação por código enviado por email
	// -------------------------------------------------------------------------

	/**
	 * Sempre retorna sucesso ainda que a entidade não exista — evita que um
	 * atacante enumere emails/CNPJs cadastrados pela diferença de resposta.
	 */
	async solicitarRecuperacaoSenha(
		input: SolicitarRecuperacaoInput,
	): Promise<{ destinatario: string | null }> {
		const alvo = await this.localizarEntidade(input.tipo, input.identificador)
		if (!alvo) return { destinatario: null }

		// Invalida códigos antigos não usados — reduz superfície de ataque.
		await this.prisma.codigoRecuperacaoSenha.updateMany({
			where: {
				tipo: input.tipo,
				entidadeId: alvo.id,
				usadoEm: null,
			},
			data: { usadoEm: new Date() },
		})

		const codigo = gerarCodigoNumerico(6)
		const codigoHash = await hashearSenha(codigo)
		await this.prisma.codigoRecuperacaoSenha.create({
			data: {
				tipo: input.tipo,
				entidadeId: alvo.id,
				codigoHash,
				expiraEm: new Date(Date.now() + VALIDADE_CODIGO_MINUTOS * 60_000),
			},
		})

		try {
			await this.email.enviar({
				destinatario: alvo.email,
				assunto: 'Recuperação de senha — DF Distribuidora',
				mensagem: montarEmailRecuperacao(codigo, alvo.nome),
			})
		} catch (err) {
			// Email falhou: removemos o código para evitar lixo no DB.
			await this.prisma.codigoRecuperacaoSenha
				.deleteMany({
					where: {
						tipo: input.tipo,
						entidadeId: alvo.id,
						codigoHash,
					},
				})
				.catch(() => undefined)
			throw new RegraNegocio(
				'FALHA_ENVIO_EMAIL',
				`Não foi possível enviar o email: ${err instanceof Error ? err.message : 'erro desconhecido'}.`,
			)
		}

		return { destinatario: mascararEmail(alvo.email) }
	}

	async redefinirSenha(input: RedefinirSenhaInput): Promise<void> {
		validarComprimentoSenha(input.senhaNova)
		const alvo = await this.localizarEntidade(input.tipo, input.identificador)
		if (!alvo) {
			throw new RegraNegocio(
				'CODIGO_INVALIDO',
				'Código inválido ou expirado. Solicite um novo.',
			)
		}

		const candidatos = await this.prisma.codigoRecuperacaoSenha.findMany({
			where: {
				tipo: input.tipo,
				entidadeId: alvo.id,
				usadoEm: null,
				expiraEm: { gt: new Date() },
			},
			orderBy: { criadoEm: 'desc' },
			take: 5,
		})

		let codigoUsado: typeof candidatos[number] | null = null
		for (const c of candidatos) {
			if (await validarSenha(input.codigo, c.codigoHash)) {
				codigoUsado = c
				break
			}
		}
		if (!codigoUsado) {
			throw new RegraNegocio(
				'CODIGO_INVALIDO',
				'Código inválido ou expirado. Solicite um novo.',
			)
		}

		const novoHash = await hashearSenha(input.senhaNova)
		await this.prisma.$transaction([
			this.prisma.codigoRecuperacaoSenha.update({
				where: { id: codigoUsado.id },
				data: { usadoEm: new Date() },
			}),
			input.tipo === 'ADMIN'
				? this.prisma.usuario.update({
						where: { id: alvo.id },
						data: { senhaHash: novoHash },
					})
				: this.prisma.cliente.update({
						where: { id: alvo.id },
						data: { senhaHash: novoHash },
					}),
		])
	}

	private async localizarEntidade(
		tipo: TipoEntidade,
		identificador: string,
	): Promise<{ id: string; email: string; nome: string } | null> {
		if (tipo === 'ADMIN') {
			const usuario = await this.prisma.usuario.findUnique({
				where: { email: identificador.trim().toLowerCase() },
			})
			if (!usuario || !usuario.ativo) return null
			return { id: usuario.id, email: usuario.email, nome: usuario.nome }
		}
		const cnpj = apenasDigitosCnpj(identificador)
		const cliente = await this.prisma.cliente.findUnique({ where: { cnpj } })
		if (!cliente || cliente.status !== 'ATIVO') return null
		return { id: cliente.id, email: cliente.email, nome: cliente.razaoSocial }
	}
}

function defaultCanalEmail(): ICanalNotificacao {
	return process.env.SMTP_HOST ? new EmailCanalSmtp() : new EmailCanalLog()
}

function gerarCodigoNumerico(tamanho: number): string {
	let s = ''
	for (let i = 0; i < tamanho; i++) s += String(randomInt(0, 10))
	return s
}

function validarComprimentoSenha(senha: string) {
	if (senha.length < SENHA_MINIMO) {
		throw new RegraNegocio(
			'SENHA_FRACA',
			`A senha deve ter ao menos ${SENHA_MINIMO} caracteres.`,
		)
	}
}

function mascararEmail(email: string): string {
	const [user, dominio] = email.split('@')
	if (!dominio) return email
	const visivel = user.slice(0, Math.min(2, user.length))
	return `${visivel}${'*'.repeat(Math.max(1, user.length - visivel.length))}@${dominio}`
}

function montarEmailRecuperacao(codigo: string, nome: string): string {
	return [
		`Olá, ${nome}.`,
		'',
		'Recebemos uma solicitação de recuperação de senha para o seu acesso.',
		`Código: ${codigo}`,
		`Validade: ${VALIDADE_CODIGO_MINUTOS} minutos.`,
		'',
		'Se você não solicitou esta recuperação, ignore este email — sua senha atual continua válida.',
	].join('\n')
}
