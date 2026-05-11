import { z } from 'zod'

export const tipoChavePixSchema = z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA'])

export const configuracoesSchema = z.object({
	beneficiario: z.object({
		cnpj: z.string(),
		razaoSocial: z.string(),
		nomeFantasia: z.string().nullable(),
		cep: z.string(),
		logradouro: z.string(),
		numero: z.string(),
		complemento: z.string().nullable(),
		bairro: z.string(),
		cidade: z.string(),
		uf: z.string(),
	}),
	banco: z.object({
		codigo: z.string(),
		nome: z.string(),
		agencia: z.string(),
		agenciaDigito: z.string().nullable(),
		conta: z.string(),
		contaDigito: z.string(),
		carteira: z.string(),
		convenio: z.string().nullable(),
		proximoNossoNumero: z.number(),
	}),
	pix: z.object({
		tipoChave: tipoChavePixSchema,
		chave: z.string(),
	}),
	encargos: z.object({
		multaPercentual: z.number(),
		jurosMensalPercentual: z.number(),
		descontoAntecipadoDias: z.number(),
		descontoPercentual: z.number(),
		mensagemPadrao: z.string().nullable(),
	}),
	whatsapp: z.object({
		mensagemBoleto: z.string().nullable(),
		mensagemConfirmacao: z.string().nullable(),
	}),
	atualizadoEm: z.string().datetime(),
})

export const atualizarConfiguracoesInputSchema = z.object({
	beneficiario: z.object({
		cnpj: z.string().min(11),
		razaoSocial: z.string().min(2),
		nomeFantasia: z.string().nullish(),
		cep: z.string().min(8),
		logradouro: z.string().min(1),
		numero: z.string().min(1),
		complemento: z.string().nullish(),
		bairro: z.string().min(1),
		cidade: z.string().min(1),
		uf: z.string().length(2),
	}),
	banco: z.object({
		codigo: z.string().min(1),
		nome: z.string().min(1),
		agencia: z.string().min(1),
		agenciaDigito: z.string().nullish(),
		conta: z.string().min(1),
		contaDigito: z.string().min(1),
		carteira: z.string().min(1),
		convenio: z.string().nullish(),
		proximoNossoNumero: z.number().int().positive().optional(),
	}),
	pix: z.object({
		tipoChave: tipoChavePixSchema,
		chave: z.string().min(1),
	}),
	encargos: z.object({
		multaPercentual: z.number().min(0).max(100).default(0),
		jurosMensalPercentual: z.number().min(0).max(100).default(0),
		descontoAntecipadoDias: z.number().int().min(0).default(0),
		descontoPercentual: z.number().min(0).max(100).default(0),
		mensagemPadrao: z.string().nullish(),
	}),
	whatsapp: z
		.object({
			mensagemBoleto: z.string().max(2000).nullish(),
			mensagemConfirmacao: z.string().max(2000).nullish(),
		})
		.optional(),
})
