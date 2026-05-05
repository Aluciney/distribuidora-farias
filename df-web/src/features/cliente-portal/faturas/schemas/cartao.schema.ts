import { z } from 'zod';
import {
  apenasDigitos,
  isCartaoValido,
  isValidadeFutura,
} from '@/utils/cartao';

export const cartaoSchema = z.object({
  numero: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length >= 13 && v.length <= 19, 'Número de cartão inválido.')
    .refine(isCartaoValido, 'Número de cartão inválido (falha Luhn).'),
  nomeImpresso: z
    .string()
    .min(2, 'Nome inválido.')
    .max(50, 'Nome muito longo.')
    .transform((v) => v.toUpperCase()),
  validade: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Use o formato MM/AA.')
    .refine(isValidadeFutura, 'Cartão expirado ou data inválida.'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV deve ter 3 ou 4 dígitos.'),
  parcelas: z
    .number({ error: 'Selecione a quantidade de parcelas.' })
    .int()
    .min(1, 'Mínimo 1x.')
    .max(12, 'Máximo 12x.'),
});

export type CartaoFormValues = z.infer<typeof cartaoSchema>;
