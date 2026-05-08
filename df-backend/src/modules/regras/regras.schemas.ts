import { z } from 'zod'

export const gatilhoSchema = z.enum(['ANTES_VENCIMENTO', 'DIA_VENCIMENTO', 'APOS_VENCIMENTO'])
export const canalSchema = z.enum(['EMAIL', 'WHATSAPP'])

export const acaoSchema = z.object({
	id: z.string(),
	canal: canalSchema,
	assunto: z.string().nullable(),
	mensagem: z.string(),
})

export const acaoInputSchema = z.object({
	canal: canalSchema,
	assunto: z.string().nullish(),
	mensagem: z.string().min(1),
})

export const regraSchema = z.object({
	id: z.string(),
	nome: z.string(),
	descricao: z.string().nullable(),
	ativo: z.boolean(),
	gatilho: gatilhoSchema,
	diasOffset: z.number(),
	acoes: z.array(acaoSchema),
	criadoEm: z.string().datetime(),
	atualizadoEm: z.string().datetime(),
})

export const regraInputSchema = z
	.object({
		nome: z.string().min(2),
		descricao: z.string().nullish(),
		ativo: z.boolean().default(true),
		gatilho: gatilhoSchema,
		diasOffset: z.number().int(),
		acoes: z.array(acaoInputSchema).min(1),
	})
	.superRefine((val, ctx) => {
		if (val.gatilho === 'ANTES_VENCIMENTO' && val.diasOffset >= 0) {
			ctx.addIssue({ code: 'custom', path: ['diasOffset'], message: 'ANTES_VENCIMENTO exige diasOffset negativo (ex.: -3).' })
		}
		if (val.gatilho === 'DIA_VENCIMENTO' && val.diasOffset !== 0) {
			ctx.addIssue({ code: 'custom', path: ['diasOffset'], message: 'DIA_VENCIMENTO exige diasOffset = 0.' })
		}
		if (val.gatilho === 'APOS_VENCIMENTO' && val.diasOffset <= 0) {
			ctx.addIssue({ code: 'custom', path: ['diasOffset'], message: 'APOS_VENCIMENTO exige diasOffset positivo (ex.: 3).' })
		}
	})
