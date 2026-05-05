import bcrypt from 'bcrypt'
import { prismaTest } from '../limpar-banco'

interface UsuarioSeedInput {
	nome?: string
	email: string
	senha?: string
	perfil?: 'ADMIN' | 'FINANCEIRO'
	ativo?: boolean
}

export async function criarUsuarioSeed(input: UsuarioSeedInput) {
	const senhaHash = await bcrypt.hash(input.senha ?? 'df2026', 4)
	return prismaTest.usuario.create({
		data: {
			nome: input.nome ?? 'Usuário Teste',
			email: input.email.toLowerCase(),
			senhaHash,
			perfil: input.perfil ?? 'ADMIN',
			ativo: input.ativo ?? true,
		},
	})
}
