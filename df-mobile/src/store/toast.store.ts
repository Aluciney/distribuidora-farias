import { create } from 'zustand';

export type ToastTom = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  titulo: string;
  mensagem?: string;
  tom: ToastTom;
}

interface ToastState {
  itens: ToastItem[];
  empilhar: (item: Omit<ToastItem, 'id'>) => void;
  remover: (id: number) => void;
}

let proximoId = 1;

export const useToastStore = create<ToastState>((set) => ({
  itens: [],
  empilhar: (item) => {
    const id = proximoId++;
    set((s) => ({ itens: [...s.itens, { id, ...item }] }));
    setTimeout(() => {
      set((s) => ({ itens: s.itens.filter((t) => t.id !== id) }));
    }, 4_000);
  },
  remover: (id) =>
    set((s) => ({ itens: s.itens.filter((t) => t.id !== id) })),
}));

export const toast = {
  sucesso: (titulo: string, mensagem?: string) =>
    useToastStore.getState().empilhar({ tom: 'success', titulo, mensagem }),
  erro: (titulo: string, mensagem?: string) =>
    useToastStore.getState().empilhar({ tom: 'error', titulo, mensagem }),
  info: (titulo: string, mensagem?: string) =>
    useToastStore.getState().empilhar({ tom: 'info', titulo, mensagem }),
};
