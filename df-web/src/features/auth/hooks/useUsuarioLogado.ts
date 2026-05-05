import { useQuery } from '@tanstack/react-query';
import { usuariosService } from '@/features/usuarios/services/usuarios.mock';
import { useAuthStore } from '@/store/auth.store';

/**
 * Resolve o objeto `Usuario` correspondente ao `usuarioId` da sessão admin.
 * Use no portal `/admin/*` para exibir dados como nome, perfil etc.
 */
export function useUsuarioLogado() {
  const usuarioId = useAuthStore((s) => s.usuarioId);
  return useQuery({
    queryKey: ['usuario-logado', usuarioId],
    queryFn: () =>
      usuarioId ? usuariosService.obter(usuarioId) : Promise.resolve(null),
    enabled: Boolean(usuarioId),
  });
}
