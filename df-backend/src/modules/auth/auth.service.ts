import type { PrismaClient } from '@prisma/client'
import { NaoAutorizado, Proibido, RegraNegocio } from '../../shared/erros'
import { apenasDigitosCnpj } from '../../shared/utils/cnpj'
import { hashearSenha, validarSenha } from '../../shared/utils/senha'

export class AuthService {
	constructor(private readonly prisma: PrismaClient) {}

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
}
