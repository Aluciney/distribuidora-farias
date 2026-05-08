import { randomInt } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { NaoAutorizado, Proibido, RegraNegocio } from '../../shared/erros'
import { hashearSenha, validarSenha } from '../../shared/utils/senha'
import type { ICanalNotificacao } from '../notificacoes/canais/canal.interface'
import { EmailCanalLog, EmailCanalSmtp } from '../notificacoes/canais/email.canal'

const VALIDADE_CODIGO_MINUTOS = 15
const SENHA_MINIMO = 6

export type TipoEntidade = 'ADMIN' | 'USUARIO_CLIENTE'

interface AlterarSenhaInput {
	tipo: TipoEntidade
	entidadeId: string
	senhaAtual: string
	senhaNova: string
}

interface SolicitarRecuperacaoInput {
	tipo: TipoEntidade
	/** Email cadastrado (mesma estrutura para ADMIN e USUARIO_CLIENTE). */
	email: string
}

interface RedefinirSenhaInput {
	tipo: TipoEntidade
	email: string
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

	async loginUsuarioCliente(email: string, senha: string) {
		const usuario = await this.prisma.usuarioCliente.findUnique({
			where: { email: email.toLowerCase() },
		})
		if (!usuario || !usuario.senhaHash || !(await validarSenha(senha, usuario.senhaHash))) {
			throw new NaoAutorizado('CREDENCIAIS_INVALIDAS', 'Email ou senha incorretos.')
		}
		if (!usuario.ativo) throw new Proibido('USUARIO_INATIVO', 'Usuário inativo.')
		await this.prisma.usuarioCliente.update({
			where: { id: usuario.id },
			data: { ultimoAcesso: new Date() },
		})
		return usuario
	}

	async obterUsuario(id: string) {
		return this.prisma.usuario.findUnique({ where: { id } })
	}

	async obterUsuarioCliente(id: string) {
		return this.prisma.usuarioCliente.findUnique({ where: { id } })
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

		const usuarioCliente = await this.prisma.usuarioCliente.findUnique({
			where: { id: input.entidadeId },
		})
		if (!usuarioCliente) throw new NaoAutorizado()
		if (!usuarioCliente.senhaHash || !(await validarSenha(input.senhaAtual, usuarioCliente.senhaHash))) {
			throw new NaoAutorizado('SENHA_ATUAL_INVALIDA', 'Senha atual incorreta.')
		}
		await this.prisma.usuarioCliente.update({
			where: { id: usuarioCliente.id },
			data: { senhaHash: await hashearSenha(input.senhaNova) },
		})
	}

	// -------------------------------------------------------------------------
	// Recuperação por código enviado por email
	// -------------------------------------------------------------------------

	/**
	 * Sempre retorna sucesso ainda que a entidade não exista — evita que um
	 * atacante enumere emails cadastrados pela diferença de resposta.
	 */
	async solicitarRecuperacaoSenha(
		input: SolicitarRecuperacaoInput,
	): Promise<{ destinatario: string | null }> {
		const alvo = await this.localizarEntidade(input.tipo, input.email)
		if (!alvo) return { destinatario: null }
		await this.gerarCodigoEEnviar({
			tipo: input.tipo,
			entidadeId: alvo.id,
			destinatario: alvo.email,
			assunto: 'Recuperação de senha — DF Distribuidora',
			mensagem: (codigo) => montarEmailRecuperacao(codigo, alvo.nome),
		})
		return { destinatario: mascararEmail(alvo.email) }
	}

	/**
	 * Envia código de boas-vindas para um UsuarioCliente recém-criado pelo
	 * admin definir a senha pela primeira vez. Mesmo mecanismo de código da
	 * recuperação — só muda o texto do email. O cliente usa `redefinirSenha`
	 * com o código recebido.
	 */
	async enviarConviteSenhaInicial(usuarioClienteId: string): Promise<{ destinatario: string }> {
		const usuario = await this.prisma.usuarioCliente.findUnique({
			where: { id: usuarioClienteId },
		})
		if (!usuario) {
			throw new RegraNegocio('USUARIO_NAO_ENCONTRADO', 'Usuário cliente não encontrado.')
		}
		if (!usuario.ativo) {
			throw new RegraNegocio('USUARIO_INATIVO', 'Usuário inativo — reative antes de enviar convite.')
		}
		await this.gerarCodigoEEnviar({
			tipo: 'USUARIO_CLIENTE',
			entidadeId: usuario.id,
			destinatario: usuario.email,
			assunto: 'Bem-vindo ao Portal DF — defina sua senha',
			mensagem: (codigo) => montarEmailConvite(codigo, usuario.nome),
		})
		return { destinatario: mascararEmail(usuario.email) }
	}

	private async gerarCodigoEEnviar(input: {
		tipo: TipoEntidade
		entidadeId: string
		destinatario: string
		assunto: string
		mensagem: (codigo: string) => string
	}): Promise<void> {
		// Invalida códigos antigos não usados — reduz superfície de ataque.
		await this.prisma.codigoRecuperacaoSenha.updateMany({
			where: { tipo: input.tipo, entidadeId: input.entidadeId, usadoEm: null },
			data: { usadoEm: new Date() },
		})

		const codigo = gerarCodigoNumerico(6)
		const codigoHash = await hashearSenha(codigo)
		await this.prisma.codigoRecuperacaoSenha.create({
			data: {
				tipo: input.tipo,
				entidadeId: input.entidadeId,
				codigoHash,
				expiraEm: new Date(Date.now() + VALIDADE_CODIGO_MINUTOS * 60_000),
			},
		})

		try {
			await this.email.enviar({
				destinatario: input.destinatario,
				assunto: input.assunto,
				mensagem: input.mensagem(codigo),
			})
		} catch (err) {
			// Email falhou: removemos o código para evitar lixo no DB.
			await this.prisma.codigoRecuperacaoSenha
				.deleteMany({
					where: { tipo: input.tipo, entidadeId: input.entidadeId, codigoHash },
				})
				.catch(() => undefined)
			throw new RegraNegocio(
				'FALHA_ENVIO_EMAIL',
				`Não foi possível enviar o email: ${err instanceof Error ? err.message : 'erro desconhecido'}.`,
			)
		}
	}

	async redefinirSenha(input: RedefinirSenhaInput): Promise<void> {
		validarComprimentoSenha(input.senhaNova)
		const alvo = await this.localizarEntidade(input.tipo, input.email)
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
				: this.prisma.usuarioCliente.update({
						where: { id: alvo.id },
						data: { senhaHash: novoHash },
					}),
		])
	}

	private async localizarEntidade(
		tipo: TipoEntidade,
		email: string,
	): Promise<{ id: string; email: string; nome: string } | null> {
		const emailNormalizado = email.trim().toLowerCase()
		if (tipo === 'ADMIN') {
			const usuario = await this.prisma.usuario.findUnique({ where: { email: emailNormalizado } })
			if (!usuario || !usuario.ativo) return null
			return { id: usuario.id, email: usuario.email, nome: usuario.nome }
		}
		const usuarioCliente = await this.prisma.usuarioCliente.findUnique({
			where: { email: emailNormalizado },
		})
		if (!usuarioCliente || !usuarioCliente.ativo) return null
		return { id: usuarioCliente.id, email: usuarioCliente.email, nome: usuarioCliente.nome }
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

function montarEmailConvite(codigo: string, nome: string): string {
	return [
		`Olá, ${nome}.`,
		'',
		'Sua conta no Portal DF foi criada. Para concluir o cadastro, defina sua senha usando o código abaixo.',
		`Código: ${codigo}`,
		`Validade: ${VALIDADE_CODIGO_MINUTOS} minutos.`,
		'',
		'Acesse o portal, clique em "Definir senha" e informe seu email + o código acima.',
	].join('\n')
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
