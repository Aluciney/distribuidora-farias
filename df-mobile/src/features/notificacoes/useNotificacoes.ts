import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificacoesService,
  type FiltrosNotificacoes,
  type ListagemNotificacoes,
} from '@/features/notificacoes/notificacoes.service';

const KEY = ['notificacoes'] as const;

const VAZIO: ListagemNotificacoes = {
  itens: [],
  total: 0,
  totalNaoLidas: 0,
  pagina: 1,
  porPagina: 10,
};

export function useNotificacoes(filtros: FiltrosNotificacoes = {}) {
  return useQuery<ListagemNotificacoes>({
    queryKey: [...KEY, filtros.pagina, filtros.porPagina],
    queryFn: () => notificacoesService.listar(filtros),
    placeholderData: VAZIO,
    refetchInterval: 30_000,
  });
}

export function useMarcarNotificacaoLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificacoesService.marcarComoLida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarcarTodasComoLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificacoesService.marcarTodasComoLidas(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
