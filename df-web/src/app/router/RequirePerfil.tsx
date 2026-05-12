import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUsuarioLogado } from '@/features/auth/hooks/useUsuarioLogado';
import { PerfilUsuario } from '@/types';

interface RequirePerfilProps {
  perfis: PerfilUsuario[];
  children: ReactNode;
}

export function RequirePerfil({ perfis, children }: RequirePerfilProps) {
  const { data: usuario, isLoading } = useUsuarioLogado();

  if (isLoading) return null;

  if (!usuario || !perfis.includes(usuario.perfil)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
