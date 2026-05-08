import { z } from 'zod';

export const loginAdminSchema = z.object({
  email: z.email('Informe um email válido.'),
  senha: z.string().min(4, 'A senha deve ter ao menos 4 caracteres.'),
});
export type LoginAdminFormValues = z.infer<typeof loginAdminSchema>;

export const loginClienteSchema = z.object({
  email: z.email('Informe um email válido.'),
  senha: z.string().min(4, 'A senha deve ter ao menos 4 caracteres.'),
});
export type LoginClienteFormValues = z.infer<typeof loginClienteSchema>;
