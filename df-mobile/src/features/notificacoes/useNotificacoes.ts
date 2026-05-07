import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacoesService } from '@/features/notificacoes/notificacoes.service';

const KEY = ['notificacoes'] as const;

export function useNotificacoes() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => notificacoesService.listar(),
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
