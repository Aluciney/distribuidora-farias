import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  faturasService,
  type FiltrosFaturasCliente,
  type PagamentoCartaoPayload,
} from '@/features/faturas/faturas.service';
import { toast } from '@/store/toast.store';
import type { Fatura, UUID } from '@/types';

const KEY = ['faturas-cliente'] as const;

export function useFaturas(filtros: FiltrosFaturasCliente = {}) {
  return useQuery({
    queryKey: [...KEY, 'lista', filtros],
    queryFn: () => faturasService.listar(filtros),
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
