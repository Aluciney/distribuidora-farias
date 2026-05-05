import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacoesService } from '@/features/cliente-portal/notificacoes/services/notificacoes.mock';
import { useAuthStore } from '@/store/auth.store';

const KEY_BASE = ['notificacoes'] as const;

export function useNotificacoes() {
  const clienteId = useAuthStore((s) => s.clienteId);
  return useQuery({
    queryKey: [...KEY_BASE, clienteId],
    queryFn: () =>
      clienteId ? notificacoesService.listar(clienteId) : Promise.resolve([]),
    enabled: Boolean(clienteId),
    refetchInterval: 30_000,
  });
}

export function useMarcarNotificacaoLida() {
  const clienteId = useAuthStore((s) => s.clienteId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clienteId
        ? notificacoesService.marcarComoLida(clienteId, id)
        : Promise.resolve(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_BASE }),
  });
}

export function useMarcarTodasComoLidas() {
  const clienteId = useAuthStore((s) => s.clienteId);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      clienteId
        ? notificacoesService.marcarTodasComoLidas(clienteId)
        : Promise.resolve(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_BASE }),
  });
}
