import type { ConfiguracoesCobranca } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { apenasDigitosCnpj } from '../../shared/utils/cnpj'
import { atualizarConfiguracoesInputSchema, configuracoesSchema } from './configuracoes.schemas'

const ID_SINGLETON = 'unica'

export function serializarConfiguracoes(c: ConfiguracoesCobranca) {
	return {
		beneficiario: {
			cnpj: c.beneficiarioCnpj,
			razaoSocial: c.beneficiarioRazaoSocial,
			nomeFantasia: c.beneficiarioNomeFantasia,
			cep: c.beneficiarioCep,
			logradouro: c.beneficiarioLogradouro,
			numero: c.beneficiarioNumero,
			complemento: c.beneficiarioComplemento,
			bairro: c.beneficiarioBairro,
			cidade: c.beneficiarioCidade,
			uf: c.beneficiarioUf,
		},
		banco: {
			codigo: c.bancoCodigo,
			nome: c.bancoNome,
			agencia: c.bancoAgencia,
			agenciaDigito: c.bancoAgenciaDigito,
			conta: c.bancoConta,
			contaDigito: c.bancoContaDigito,
			carteira: c.bancoCarteira,
			convenio: c.bancoConvenio,
			proximoNossoNumero: c.bancoProximoNossoNumero,
		},
		pix: { tipoChave: c.pixTipoChave, chave: c.pixChave },
		encargos: {
			multaPercentual: Number(c.encargosMultaPercentual),
			jurosMensalPercentual: Number(c.encargosJurosMensalPercentual),
			descontoAntecipadoDias: c.encargosDescontoAntecipadoDias,
			descontoPercentual: Number(c.encargosDescontoPercentual),
			mensagemPadrao: c.encargosMensagemPadrao,
		},
		whatsapp: {
			mensagemBoleto: c.whatsappMensagemBoleto,
		},
		atualizadoEm: c.atualizadoEm.toISOString(),
	}
}

export async function rotasConfiguracoes(app: FastifyInstance) {
	const a = app.withTypeProvider<ZodTypeProvider>()
	const guard = [app.requerAdmin]

	a.get(
		'/',
		{
			schema: {
				tags: ['Configurações'],
				summary: 'Obtém configurações de cobrança',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				response: { 200: configuracoesSchema },
			},
			preHandler: guard,
		},
		async () => {
			const c =
				(await app.prisma.configuracoesCobranca.findUnique({ where: { id: ID_SINGLETON } })) ??
				(await app.prisma.configuracoesCobranca.create({
					data: {
						id: ID_SINGLETON,
						beneficiarioCnpj: '',
						beneficiarioRazaoSocial: '',
						beneficiarioCep: '',
						beneficiarioLogradouro: '',
						beneficiarioNumero: '',
						beneficiarioBairro: '',
						beneficiarioCidade: '',
						beneficiarioUf: '',
						bancoCodigo: '',
						bancoNome: '',
						bancoAgencia: '',
						bancoConta: '',
						bancoContaDigito: '',
						bancoCarteira: '',
						pixTipoChave: 'CNPJ',
						pixChave: '',
					},
				}))
			return serializarConfiguracoes(c)
		},
	)

	a.put(
		'/',
		{
			schema: {
				tags: ['Configurações'],
				summary: 'Atualiza configurações de cobrança',
				security: [{ cookieAuth: [] }, { bearerAuth: [] }],
				body: atualizarConfiguracoesInputSchema,
				response: { 200: configuracoesSchema },
			},
			preHandler: guard,
		},
		async (req) => {
			const i = req.body
			const data = {
				beneficiarioCnpj: apenasDigitosCnpj(i.beneficiario.cnpj),
				beneficiarioRazaoSocial: i.beneficiario.razaoSocial,
				beneficiarioNomeFantasia: i.beneficiario.nomeFantasia ?? null,
				beneficiarioCep: i.beneficiario.cep,
				beneficiarioLogradouro: i.beneficiario.logradouro,
				beneficiarioNumero: i.beneficiario.numero,
				beneficiarioComplemento: i.beneficiario.complemento ?? null,
				beneficiarioBairro: i.beneficiario.bairro,
				beneficiarioCidade: i.beneficiario.cidade,
				beneficiarioUf: i.beneficiario.uf.toUpperCase(),
				bancoCodigo: i.banco.codigo,
				bancoNome: i.banco.nome,
				bancoAgencia: i.banco.agencia,
				bancoAgenciaDigito: i.banco.agenciaDigito ?? null,
				bancoConta: i.banco.conta,
				bancoContaDigito: i.banco.contaDigito,
				bancoCarteira: i.banco.carteira,
				bancoConvenio: i.banco.convenio ?? null,
				...(i.banco.proximoNossoNumero ? { bancoProximoNossoNumero: i.banco.proximoNossoNumero } : {}),
				pixTipoChave: i.pix.tipoChave,
				pixChave: i.pix.chave,
				encargosMultaPercentual: i.encargos.multaPercentual,
				encargosJurosMensalPercentual: i.encargos.jurosMensalPercentual,
				encargosDescontoAntecipadoDias: i.encargos.descontoAntecipadoDias,
				encargosDescontoPercentual: i.encargos.descontoPercentual,
				encargosMensagemPadrao: i.encargos.mensagemPadrao ?? null,
				whatsappMensagemBoleto: i.whatsapp?.mensagemBoleto ?? null,
			}
			const c = await app.prisma.configuracoesCobranca.upsert({
				where: { id: ID_SINGLETON },
				create: { id: ID_SINGLETON, ...data },
				update: data,
			})
			return serializarConfiguracoes(c)
		},
	)
}
