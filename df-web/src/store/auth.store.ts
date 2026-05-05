import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UUID } from '@/types';

/**
 * Sessão mockada do sistema. Em produção esta informação virá do JWT/cookie
 * de autenticação. Aqui guardamos o tipo de sessão (ADMIN ou CLIENTE) e o ID
 * correspondente para filtrar dados nas telas protegidas.
 */
export type TipoSessao = 'ADMIN' | 'CLIENTE';

interface AuthState {
  /** Tipo da sessão ativa. `null` quando deslogado. */
  tipo: TipoSessao | null;
  /** ID do usuário admin/financeiro logado. Preenchido quando tipo === 'ADMIN'. */
  usuarioId: UUID | null;
  /** ID do cliente logado no portal. Preenchido quando tipo === 'CLIENTE'. */
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
      logout: () => set({ tipo: null, usuarioId: null, clienteId: null }),
    }),
    { name: 'df-pagamentos:auth', version: 2 },
  ),
);
