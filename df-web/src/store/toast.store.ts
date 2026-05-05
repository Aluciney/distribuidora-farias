import { create } from 'zustand';

export type TipoToast = 'sucesso' | 'erro' | 'info' | 'aviso';

export interface Toast {
  id: string;
  tipo: TipoToast;
  titulo: string;
  descricao?: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'> & { duracaoMs?: number }) => void;
  remove: (id: string) => void;
}

const DURACAO_PADRAO_MS = 4000;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  push: ({ duracaoMs = DURACAO_PADRAO_MS, ...toast }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
    if (duracaoMs > 0) {
      setTimeout(() => get().remove(id), duracaoMs);
    }
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Helpers ergonômicos para uso em hooks/componentes. */
export const toast = {
  sucesso: (titulo: string, descricao?: string) =>
    useToastStore.getState().push({ tipo: 'sucesso', titulo, descricao }),
  erro: (titulo: string, descricao?: string) =>
    useToastStore.getState().push({ tipo: 'erro', titulo, descricao }),
  info: (titulo: string, descricao?: string) =>
    useToastStore.getState().push({ tipo: 'info', titulo, descricao }),
  aviso: (titulo: string, descricao?: string) =>
    useToastStore.getState().push({ tipo: 'aviso', titulo, descricao }),
};
