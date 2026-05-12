import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type TipoSessao } from '@/store/auth.store';

interface RequireAuthProps {
  /** Tipo de sessão exigido nesta árvore de rotas. */
  tipo: TipoSessao;
  children: ReactNode;
}

/**
 * Bloqueia o acesso à árvore de rotas filha quando a sessão atual não bate
 * com o `tipo` esperado. Redireciona para `/login` (cliente) ou `/admin/login`
 * (admin) preservando a rota original em `state.from`.
 */
export function RequireAuth({ tipo, children }: RequireAuthProps) {
  const tipoAtual = useAuthStore((s) => s.tipo);
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const usuarioClienteId = useAuthStore((s) => s.usuarioClienteId);
  const location = useLocation();

  const autenticado =
    tipoAtual === tipo &&
    ((tipo === 'ADMIN' && Boolean(usuarioId)) ||
      (tipo === 'USUARIO_CLIENTE' && Boolean(usuarioClienteId)));

  if (!autenticado) {
    const destino = tipo === 'ADMIN' ? '/admin/login' : '/login';
    return (
      <Navigate
        to={destino}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
