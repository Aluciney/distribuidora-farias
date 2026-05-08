import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  faturasService,
  type FiltrosFaturasCliente,
  type PagamentoCartaoPayload,
} from '@/features/faturas/faturas.service';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';
import type { Fatura, UUID } from '@/types';

const KEY = ['faturas-cliente'] as const;

/**
 * Lista faturas escopada à filial selecionada (ou consolidada quando "todas").
 * O filtro pode ser sobrescrito explicitamente via `filialId` no input.
 */
export function useFaturas(filtros: FiltrosFaturasCliente = {}) {
  const filialSelecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  const filialEfetiva =
    filtros.filialId !== undefined ? filtros.filialId : filialSelecionadaId;
  const filtrosEfetivos: FiltrosFaturasCliente = {
    ...filtros,
    filialId: filialEfetiva ?? undefined,
  };
  return useQuery({
    queryKey: [...KEY, 'lista', filtrosEfetivos],
    queryFn: () => faturasService.listar(filtrosEfetivos),
  });
}

export function useFatura(id: UUID | undefined) {
  return useQuery({
    queryKey: [...KEY, 'detalhe', id],
    queryFn: () => faturasService.obter(id!),
    enabled: Boolean(id),
  });
}

export function usePagarComCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: UUID;
      payload: PagamentoCartaoPayload;
    }) => faturasService.pagarComCartao(id, payload),
    onSuccess: (fatura: Fatura) => {
      qc.invalidateQueries({ queryKey: KEY });
      const ult = fatura.pagamento?.cartao?.ultimosDigitos ?? '';
      toast.sucesso(
        'Pagamento aprovado',
        `${fatura.numero} foi paga com cartão final ${ult}.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Pagamento recusado', err.message);
    },
  });
}
