import { z } from 'zod';
import { MetodoPagamento } from '@/types';

const dataObrigatoria = z
  .string()
  .min(1, 'Informe a data.')
  .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Data inválida.');

export const novaCobrancaSchema = z.object({
  pedidoId: z.string().min(1, 'Selecione um pedido.'),
  /** Valor em reais — convertido para centavos antes de enviar. */
  valor: z
    .number({ error: 'Informe um valor numérico.' })
    .gt(0, 'Valor deve ser maior que zero.'),
  dataVencimento: dataObrigatoria,
  observacoes: z.string().optional().or(z.literal('')),
});
export type NovaCobrancaFormValues = z.infer<typeof novaCobrancaSchema>;

export const baixaManualSchema = z.object({
  dataPagamento: dataObrigatoria,
  metodoPago: z.enum([
    MetodoPagamento.BOLETO,
    MetodoPagamento.PIX,
    MetodoPagamento.CARTAO_CREDITO,
    MetodoPagamento.DINHEIRO,
  ]),
  observacoes: z.string().optional().or(z.literal('')),
});
export type BaixaManualFormValues = z.infer<typeof baixaManualSchema>;

export const cancelarFaturaSchema = z.object({
  motivo: z
    .string()
    .min(5, 'Descreva o motivo (mínimo 5 caracteres).')
    .max(255, 'Motivo deve ter no máximo 255 caracteres.'),
});
export type CancelarFaturaFormValues = z.infer<typeof cancelarFaturaSchema>;
