import { useQuery } from '@tanstack/react-query';
import { gerarFluxoCaixaMock } from '@/features/fluxo-caixa/mocks/fluxoCaixa.mock';

export function useFluxoCaixa(mesReferencia: string) {
  return useQuery({
    queryKey: ['fluxo-caixa', mesReferencia],
    queryFn: () => gerarFluxoCaixaMock(mesReferencia),
  });
}
