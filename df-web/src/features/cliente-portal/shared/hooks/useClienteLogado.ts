import { useQuery } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth.mock';
import { fromUsuarioClienteDTO } from '@/services/api/transformers';
import { useAuthStore } from '@/store/auth.store';
import type { UsuarioCliente } from '@/types';

/**
 * Resolve o `UsuarioCliente` (holding) da sessão consultando `/auth/eu` —
 * único endpoint acessível pelo próprio usuário do portal. Inclui as filiais
 * vinculadas, usadas pelo seletor de filial e pela página de perfil.
 */
export function useUsuarioClienteLogado() {
  const usuarioClienteId = useAuthStore((s) => s.usuarioClienteId);
  const setFiliais = useAuthStore((s) => s.setFiliais);
  return useQuery<UsuarioCliente | null>({
    queryKey: ['usuario-cliente-logado', usuarioClienteId],
    queryFn: async () => {
      const eu = await authService.eu();
      if (eu.tipo !== 'USUARIO_CLIENTE' || !eu.usuarioCliente) return null;
      const u = fromUsuarioClienteDTO(eu.usuarioCliente);
      // Mantém o store sincronizado com a verdade do servidor (filial pode
      // ter sido vinculada/desvinculada por um admin desde o login).
      setFiliais(u.filiais);
      return u;
    },
    enabled: Boolean(usuarioClienteId),
  });
}

/** @deprecated Use `useUsuarioClienteLogado`. */
export const useClienteLogado = useUsuarioClienteLogado;
