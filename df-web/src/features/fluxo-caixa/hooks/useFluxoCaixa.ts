import { useQuery } from '@tanstack/react-query';
import {
  gerarFluxoCaixaMock,
  type FluxoCaixaMensal,
} from '@/features/fluxo-caixa/mocks/fluxoCaixa.mock';

const SIMULATED_LATENCY_MS = 350;

async function fetchFluxoCaixa(mesReferencia: string): Promise<FluxoCaixaMensal> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
  return gerarFluxoCaixaMock(mesReferencia);
}

export function useFluxoCaixa(mesReferencia: string) {
  return useQuery({
    queryKey: ['fluxo-caixa', mesReferencia],
    queryFn: () => fetchFluxoCaixa(mesReferencia),
  });
}
