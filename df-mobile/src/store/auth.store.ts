/**
 * Sessão do cliente. O token JWT vem da rota /auth/login/cliente e é
 * persistido em AsyncStorage para sobreviver ao reinício do app.
 *
 * Diferente do web (que usa cookie httpOnly), o mobile envia o token via
 * header Authorization Bearer.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setarToken } from '@/services/http';
import { removerPushTokenDoBackend } from '@/services/push';
import type { FilialAcesso, UUID, UsuarioClienteSessao } from '@/types';

interface AuthState {
  token: string | null;
  usuarioCliente: UsuarioClienteSessao | null;
  /** Filial selecionada no seletor — `null` significa "todas as filiais". */
  filialSelecionadaId: UUID | null;
  /** Estado do hidratador do AsyncStorage — true depois que o store carrega o disco. */
  hidratado: boolean;

  loginUsuarioCliente: (
    token: string,
    usuarioCliente: UsuarioClienteSessao,
  ) => void;
  setUsuarioCliente: (usuarioCliente: UsuarioClienteSessao) => void;
  setFiliais: (filiais: FilialAcesso[]) => void;
  setFilialSelecionada: (id: UUID | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuarioCliente: null,
      filialSelecionadaId: null,
      hidratado: false,
      loginUsuarioCliente: (token, usuarioCliente) => {
        setarToken(token);
        set({ token, usuarioCliente, filialSelecionadaId: null });
      },
      setUsuarioCliente: (usuarioCliente) => set({ usuarioCliente }),
      setFiliais: (filiais) =>
        set((s) => {
          if (!s.usuarioCliente) return s;
          return { usuarioCliente: { ...s.usuarioCliente, filiais } };
        }),
      setFilialSelecionada: (id) => set({ filialSelecionadaId: id }),
      logout: () => {
        // Remove o push token antes de invalidar a sessão (precisa do Bearer
        // ainda válido para autenticar a chamada DELETE).
        void removerPushTokenDoBackend();
        api.post('/auth/logout').catch(() => undefined);
        setarToken(null);
        set({
          token: null,
          usuarioCliente: null,
          filialSelecionadaId: null,
        });
      },
    }),
    {
      name: 'df-mobile:auth',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        usuarioCliente: state.usuarioCliente,
        filialSelecionadaId: state.filialSelecionadaId,
      }),
      // Versões antigas guardavam `cliente` (Cliente) — descartadas: força login.
      migrate: (persisted: unknown, version) => {
        if (version < 2) {
          return {
            token: null,
            usuarioCliente: null,
            filialSelecionadaId: null,
          };
        }
        return persisted as Partial<AuthState>;
      },
      onRehydrateStorage: () => (state) => {
        if (state?.token) setarToken(state.token);
        useAuthStore.setState({ hidratado: true });
      },
    },
  ),
);
