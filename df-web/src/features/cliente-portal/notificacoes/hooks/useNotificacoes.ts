import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacoesService } from '@/features/cliente-portal/notificacoes/services/notificacoes.mock';
import { useAuthStore } from '@/store/auth.store';

const KEY_BASE = ['notificacoes'] as const;

export function useNotificacoes() {
  const usuarioClienteId = useAuthStore((s) => s.usuarioClienteId);
  return useQuery({
    queryKey: [...KEY_BASE, usuarioClienteId],
    queryFn: () =>
      usuarioClienteId
        ? notificacoesService.listar()
        : Promise.resolve([]),
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
