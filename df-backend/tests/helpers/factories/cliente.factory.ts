import bcrypt from 'bcrypt'
import { prismaTest } from '../limpar-banco'

interface ClienteSeedInput {
	cnpj: string
	razaoSocial?: string
	email?: string
	telefone?: string
	senha?: string
	status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'
}

export async function criarClienteSeed(input: ClienteSeedInput) {
	const senhaHash = input.senha ? await bcrypt.hash(input.senha, 4) : null
	return prismaTest.cliente.create({
		data: {
			cnpj: input.cnpj.replace(/\D/g, ''),
			razaoSocial: input.razaoSocial ?? 'Cliente Teste LTDA',
			email: input.email ?? 'cliente@teste.com',
			telefone: input.telefone ?? '91999999999',
			status: input.status ?? 'ATIVO',
			senhaHash,
			enderecoCep: '66000000',
			enderecoLogradouro: 'Rua A',
			enderecoNumero: '1',
			enderecoBairro: 'Centro',
			enderecoCidade: 'Belém',
			enderecoUf: 'PA',
		},
	})
}
