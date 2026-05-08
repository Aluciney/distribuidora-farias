import { z } from 'zod';
import { CanalNotificacao, GatilhoRegua } from '@/types';

const acaoSchema = z
  .object({
    canal: z.enum([CanalNotificacao.EMAIL, CanalNotificacao.WHATSAPP]),
    assunto: z.string().max(150).optional().or(z.literal('')),
    mensagem: z
      .string()
      .min(10, 'A mensagem deve ter ao menos 10 caracteres.')
      .max(1000, 'A mensagem deve ter no máximo 1000 caracteres.'),
  })
  .superRefine((val, ctx) => {
    if (val.canal === CanalNotificacao.EMAIL && (!val.assunto || val.assunto.length < 3)) {
      ctx.addIssue({
        code: 'custom',
        path: ['assunto'],
        message: 'Email requer um assunto (mínimo 3 caracteres).',
      });
    }
  });

export const regraSchema = z
  .object({
    nome: z.string().min(3, 'Informe um nome (mínimo 3 caracteres).'),
    descricao: z.string().max(255).optional().or(z.literal('')),
    ativo: z.boolean(),
    gatilho: z.enum([
      GatilhoRegua.ANTES_VENCIMENTO,
      GatilhoRegua.DIA_VENCIMENTO,
      GatilhoRegua.APOS_VENCIMENTO,
    ]),
    diasOffset: z
      .number({ error: 'Informe a quantidade de dias.' })
      .int('Use um número inteiro.')
      .min(-90, 'Máximo 90 dias antes.')
      .max(180, 'Máximo 180 dias depois.'),
    acoes: z
      .array(acaoSchema)
      .min(1, 'Adicione pelo menos uma ação.')
      .max(5, 'Limite de 5 ações por regra.'),
  })
  .superRefine((val, ctx) => {
    // Coerência entre gatilho e diasOffset.
    if (val.gatilho === GatilhoRegua.DIA_VENCIMENTO && val.diasOffset !== 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['diasOffset'],
        message: 'Para "no dia do vencimento", os dias devem ser 0.',
      });
    }
    if (val.gatilho === GatilhoRegua.ANTES_VENCIMENTO && val.diasOffset >= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['diasOffset'],
        message: 'Para "antes do vencimento", use número negativo.',
      });
    }
    if (val.gatilho === GatilhoRegua.APOS_VENCIMENTO && val.diasOffset <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['diasOffset'],
        message: 'Para "após o vencimento", use número positivo.',
      });
    }
  });

export type RegraFormValues = z.infer<typeof regraSchema>;
