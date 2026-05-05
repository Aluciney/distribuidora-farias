import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UUID } from '@/types';
import { api } from '@/services/api/http';

/**
 * Sessão do sistema. O token JWT vive em cookie httpOnly assinado pelo
 * backend (`df_session`); o store guarda apenas metadados de UI: tipo da
 * sessão e o id correspondente para enriquecer telas/queries.
 */
export type TipoSessao = 'ADMIN' | 'CLIENTE';

interface AuthState {
  tipo: TipoSessao | null;
  usuarioId: UUID | null;
  clienteId: UUID | null;
  loginAdmin: (usuarioId: UUID) => void;
  loginCliente: (clienteId: UUID) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tipo: null,
      usuarioId: null,
      clienteId: null,
      loginAdmin: (usuarioId) =>
        set({ tipo: 'ADMIN', usuarioId, clienteId: null }),
      loginCliente: (clienteId) =>
        set({ tipo: 'CLIENTE', clienteId, usuarioId: null }),
      logout: () => {
        // Avisa o backend para invalidar o cookie httpOnly. Fire-and-forget:
        // a UI já navega para /login independentemente do resultado.
        api.post('/auth/logout').catch(() => {
          /* ignora — pode estar offline */
        });
        set({ tipo: null, usuarioId: null, clienteId: null });
      },
    }),
    { name: 'df-pagamentos:auth', version: 2 },
  ),
);
