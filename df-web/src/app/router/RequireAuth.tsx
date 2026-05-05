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
 * com o `tipo` esperado. Redireciona para `/login` preservando a intenção
 * via query string (`?tipo=cliente|admin`).
 */
export function RequireAuth({ tipo, children }: RequireAuthProps) {
  const tipoAtual = useAuthStore((s) => s.tipo);
  const usuarioId = useAuthStore((s) => s.usuarioId);
  const clienteId = useAuthStore((s) => s.clienteId);
  const location = useLocation();

  const autenticado =
    tipoAtual === tipo &&
    ((tipo === 'ADMIN' && Boolean(usuarioId)) ||
      (tipo === 'CLIENTE' && Boolean(clienteId)));

  if (!autenticado) {
    const param = tipo === 'CLIENTE' ? 'cliente' : 'admin';
    return (
      <Navigate
        to={`/login?tipo=${param}`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
