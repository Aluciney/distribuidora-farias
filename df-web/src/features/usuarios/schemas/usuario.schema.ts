import { z } from 'zod';
import { PerfilUsuario } from '@/types';

export const usuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres.'),
  email: z
    .email('Informe um email válido.')
    .max(150, 'Email muito longo.'),
  perfil: z.enum([
    PerfilUsuario.ADMIN,
    PerfilUsuario.FINANCEIRO,
    PerfilUsuario.CLIENTE,
  ]),
  ativo: z.boolean(),
});

export type UsuarioFormValues = z.infer<typeof usuarioSchema>;
