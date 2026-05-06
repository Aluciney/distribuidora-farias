import { z } from 'zod'

export const statusFaturaSchema = z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO', 'ESTORNADO'])
export const metodoPagamentoSchema = z.enum(['BOLETO', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO'])

export const clienteResumoSchema = z
	.object({
		id: z.string(),
		cnpj: z.string(),
		razaoSocial: z.string(),
		nomeFantasia: z.string().nullable(),
		email: z.string(),
		telefone: z.string(),
	})
	.nullable()

export const faturaSchema = z.object({
	id: z.string(),
	numero: z.string(),
	pedidoId: z.string(),
	clienteId: z.string(),
	cliente: clienteResumoSchema,
	valor: z.number(),
	valorPago: z.number().nullable(),
	status: statusFaturaSchema,
	dataEmissao: z.string().datetime(),
	dataVencimento: z.string().datetime(),
	dataPagamento: z.string().datetime().nullable(),
	observacoes: z.string().nullable(),
	boleto: z.object({
		linhaDigitavel: z.string(),
		codigoBarras: z.string(),
		nossoNumero: z.string(),
		url: z.string().nullable(),
	}),
	pix: z.object({
		copiaECola: z.string(),
		qrCode: z.string(),
		txid: z.string(),
		expiraEm: z.string().datetime().nullable(),
	}),
	pagamento: z
		.object({
			metodo: metodoPagamentoSchema,
			cartao: z
				.object({
					bandeira: z.string(),
					ultimosDigitos: z.string(),
					parcelas: z.number(),
					authorizationId: z.string(),
				})
				.nullable(),
		})
		.nullable(),
	cancelamento: z
		.object({
			motivo: z.string(),
			canceladoEm: z.string().datetime(),
		})
		.nullable(),
	criadoEm: z.string().datetime(),
	atualizadoEm: z.string().datetime(),
})

export const listarCobrancasQuerySchema = z.object({
	busca: z.string().optional(),
	status: statusFaturaSchema.optional(),
	clienteId: z.string().uuid().optional(),
	pagina: z.coerce.number().int().positive().default(1),
	porPagina: z.coerce.number().int().positive().max(100).default(20),
})

export const criarCobrancaInputSchema = z.object({
	pedidoId: z.string().uuid(),
	dataVencimento: z.string().datetime(),
	valor: z.number().int().positive().optional(),
	observacoes: z.string().nullish(),
})

export const baixaManualInputSchema = z.object({
	dataPagamento: z.string().datetime(),
	metodoPago: metodoPagamentoSchema,
	observacoes: z.string().nullish(),
})

export const cancelarInputSchema = z.object({
	motivo: z.string().min(3),
})

export const pagarComCartaoInputSchema = z.object({
	numero: z.string().min(13).max(25),
	nomeImpresso: z.string().min(2),
	validade: z.string().regex(/^\d{2}\/\d{2}(\d{2})?$/),
	cvv: z.string().min(3).max(4),
	parcelas: z.number().int().min(1).max(12),
})
