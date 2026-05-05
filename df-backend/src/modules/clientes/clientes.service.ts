import type { Cliente, PrismaClient, StatusCliente } from '@prisma/client'
import { Conflito, NaoEncontrado, RegraNegocio } from '../../shared/erros'
import { apenasDigitosCnpj, validarCnpj } from '../../shared/utils/cnpj'

interface Endereco {
	cep: string
	logradouro: string
	numero: string
	complemento?: string | null
	bairro: string
	cidade: string
	uf: string
}

interface CriarInput {
	cnpj: string
	razaoSocial: string
	nomeFantasia?: string | null
	inscricaoEstadual?: string | null
	email: string
	telefone: string
	limiteCredito: number
	observacoes?: string | null
	endereco: Endereco
	status: StatusCliente
}

interface AtualizarInput {
	razaoSocial?: string
	nomeFantasia?: string | null
	inscricaoEstadual?: string | null
	email?: string
	telefone?: string
	limiteCredito?: number
	observacoes?: string | null
	endereco?: Endereco
}

export class ClientesService {
	constructor(private readonly prisma: PrismaClient) {}

	async listar(filtros: { busca?: string; status?: StatusCliente }): Promise<Cliente[]> {
		return this.prisma.cliente.findMany({
			where: {
				status: filtros.status,
				...(filtros.busca
					? {
							OR: [
								{ razaoSocial: { contains: filtros.busca, mode: 'insensitive' } },
								{ nomeFantasia: { contains: filtros.busca, mode: 'insensitive' } },
								{ cnpj: { contains: apenasDigitosCnpj(filtros.busca) } },
							],
						}
					: {}),
			},
			orderBy: { razaoSocial: 'asc' },
		})
	}

	async obter(id: string): Promise<Cliente> {
		const c = await this.prisma.cliente.findUnique({ where: { id } })
		if (!c) throw new NaoEncontrado('Cliente', id)
		return c
	}

	async obterPorCnpj(cnpj: string): Promise<Cliente | null> {
		return this.prisma.cliente.findUnique({ where: { cnpj: apenasDigitosCnpj(cnpj) } })
	}

	async criar(input: CriarInput): Promise<Cliente> {
		const cnpjDigitos = apenasDigitosCnpj(input.cnpj)
		if (!validarCnpj(cnpjDigitos)) throw new RegraNegocio('CNPJ_INVALIDO', 'CNPJ inválido.')
		const existe = await this.prisma.cliente.findUnique({ where: { cnpj: cnpjDigitos } })
		if (existe) throw new Conflito('CONFLITO_CNPJ', 'Já existe um cliente cadastrado com este CNPJ.', { cnpj: cnpjDigitos })
		return this.prisma.cliente.create({
			data: {
				cnpj: cnpjDigitos,
				razaoSocial: input.razaoSocial,
				nomeFantasia: input.nomeFantasia ?? null,
				inscricaoEstadual: input.inscricaoEstadual ?? null,
				email: input.email,
				telefone: input.telefone,
				status: input.status,
				limiteCredito: input.limiteCredito,
				observacoes: input.observacoes ?? null,
				enderecoCep: input.endereco.cep,
				enderecoLogradouro: input.endereco.logradouro,
				enderecoNumero: input.endereco.numero,
				enderecoComplemento: input.endereco.complemento ?? null,
				enderecoBairro: input.endereco.bairro,
				enderecoCidade: input.endereco.cidade,
				enderecoUf: input.endereco.uf.toUpperCase(),
			},
		})
	}

	async atualizar(id: string, input: AtualizarInput): Promise<Cliente> {
		await this.obter(id)
		return this.prisma.cliente.update({
			where: { id },
			data: {
				razaoSocial: input.razaoSocial,
				nomeFantasia: input.nomeFantasia,
				inscricaoEstadual: input.inscricaoEstadual,
				email: input.email,
				telefone: input.telefone,
				limiteCredito: input.limiteCredito,
				observacoes: input.observacoes,
				...(input.endereco
					? {
							enderecoCep: input.endereco.cep,
							enderecoLogradouro: input.endereco.logradouro,
							enderecoNumero: input.endereco.numero,
							enderecoComplemento: input.endereco.complemento ?? null,
							enderecoBairro: input.endereco.bairro,
							enderecoCidade: input.endereco.cidade,
							enderecoUf: input.endereco.uf.toUpperCase(),
						}
					: {}),
			},
		})
	}

	async alterarStatus(id: string, status: StatusCliente): Promise<Cliente> {
		await this.obter(id)
		return this.prisma.cliente.update({ where: { id }, data: { status } })
	}
}
