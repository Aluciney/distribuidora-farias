import { z } from 'zod';
import { apenasDigitos, isCNPJValido } from '@/utils/cnpj';

export const loginAdminSchema = z.object({
  email: z.email('Informe um email válido.'),
  senha: z.string().min(4, 'A senha deve ter ao menos 4 caracteres.'),
});
export type LoginAdminFormValues = z.infer<typeof loginAdminSchema>;

export const loginClienteSchema = z.object({
  cnpj: z
    .string()
    .transform((v) => apenasDigitos(v))
    .refine((v) => v.length === 14, 'CNPJ deve ter 14 dígitos.')
    .refine(isCNPJValido, 'CNPJ inválido.'),
  senha: z.string().min(4, 'A senha deve ter ao menos 4 caracteres.'),
});
export type LoginClienteFormValues = z.infer<typeof loginClienteSchema>;
