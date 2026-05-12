import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificacoesService,
  type FiltrosNotificacoes,
  type ListagemNotificacoes,
} from '@/features/cliente-portal/notificacoes/services/notificacoes.mock';
import { useAuthStore } from '@/store/auth.store';

const KEY_BASE = ['notificacoes'] as const;

const VAZIO: ListagemNotificacoes = {
  itens: [],
  total: 0,
  totalNaoLidas: 0,
  pagina: 1,
  porPagina: 10,
};

export function useNotificacoes(filtros: FiltrosNotificacoes = {}) {
  const usuarioClienteId = useAuthStore((s) => s.usuarioClienteId);
  return useQuery<ListagemNotificacoes>({
    queryKey: [...KEY_BASE, usuarioClienteId, filtros.pagina, filtros.porPagina],
    queryFn: () =>
      usuarioClienteId
        ? notificacoesService.listar(filtros)
        : Promise.resolve(VAZIO),
    enabled: Boolean(usuarioClienteId),
    refetchInterval: 30_000,
  });
}

export function useMarcarNotificacaoLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificacoesService.marcarComoLida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_BASE }),
  });
}

export function useMarcarTodasComoLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificacoesService.marcarTodasComoLidas(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_BASE }),
  });
}
