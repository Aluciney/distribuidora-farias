import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilialAcesso, UUID, UsuarioCliente } from '@/types';
import { api } from '@/services/api/http';

/**
 * Sessão do sistema. O token JWT vive em cookie httpOnly assinado pelo
 * backend (`df_session`); o store guarda apenas metadados de UI: tipo da
 * sessão, ids correspondentes e — para o portal do cliente — a lista de
 * filiais acessíveis (para o seletor) e qual filial está selecionada.
 */
export type TipoSessao = 'ADMIN' | 'USUARIO_CLIENTE';

interface AuthState {
  tipo: TipoSessao | null;
  /** Id do `Usuario` admin logado (quando tipo === 'ADMIN'). */
  usuarioId: UUID | null;
  /** Id do `UsuarioCliente` (holding) logado (quando tipo === 'USUARIO_CLIENTE'). */
  usuarioClienteId: UUID | null;
  /** Filiais acessíveis pela holding logada (lidas do payload do login/eu). */
  filiais: FilialAcesso[];
  /** Filial selecionada no seletor — `null` significa "todas". */
  filialSelecionadaId: UUID | null;
  loginAdmin: (usuarioId: UUID) => void;
  loginUsuarioCliente: (usuario: UsuarioCliente) => void;
  setFilialSelecionada: (filialId: UUID | null) => void;
  setFiliais: (filiais: FilialAcesso[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tipo: null,
      usuarioId: null,
      usuarioClienteId: null,
      filiais: [],
      filialSelecionadaId: null,
      loginAdmin: (usuarioId) =>
        set({
          tipo: 'ADMIN',
          usuarioId,
          usuarioClienteId: null,
          filiais: [],
          filialSelecionadaId: null,
        }),
      loginUsuarioCliente: (usuario) =>
        set({
          tipo: 'USUARIO_CLIENTE',
          usuarioClienteId: usuario.id,
          usuarioId: null,
          filiais: usuario.filiais,
          // Por padrão, "Todas as filiais" — null. O usuário pode escolher
          // uma específica no seletor do header.
          filialSelecionadaId: null,
        }),
      setFilialSelecionada: (filialId) =>
        set({ filialSelecionadaId: filialId }),
      setFiliais: (filiais) => set({ filiais }),
      logout: () => {
        // Avisa o backend para invalidar o cookie httpOnly. Fire-and-forget:
        // a UI já navega para /login independentemente do resultado.
        api.post('/auth/logout').catch(() => {
          /* ignora — pode estar offline */
        });
        set({
          tipo: null,
          usuarioId: null,
          usuarioClienteId: null,
          filiais: [],
          filialSelecionadaId: null,
        });
      },
    }),
    { name: 'df-pagamentos:auth', version: 3 },
  ),
);
