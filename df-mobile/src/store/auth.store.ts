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
import type { ClienteSessao } from '@/types';

interface AuthState {
  token: string | null;
  cliente: ClienteSessao | null;
  /** Estado do hidratador do AsyncStorage — true depois que o store carrega o disco. */
  hidratado: boolean;

  loginCliente: (token: string, cliente: ClienteSessao) => void;
  setCliente: (cliente: ClienteSessao) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      cliente: null,
      hidratado: false,
      loginCliente: (token, cliente) => {
        setarToken(token);
        set({ token, cliente });
      },
      setCliente: (cliente) => set({ cliente }),
      logout: () => {
        // Remove o push token antes de invalidar a sessão (precisa do Bearer
        // ainda válido para autenticar a chamada DELETE).
        void removerPushTokenDoBackend();
        api.post('/auth/logout').catch(() => undefined);
        setarToken(null);
        set({ token: null, cliente: null });
      },
    }),
    {
      name: 'df-mobile:auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, cliente: state.cliente }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setarToken(state.token);
        useAuthStore.setState({ hidratado: true });
      },
    },
  ),
);
