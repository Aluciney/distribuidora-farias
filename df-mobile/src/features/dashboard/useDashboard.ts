import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/http';
import { useAuthStore } from '@/store/auth.store';
import type { StatusFatura, UUID } from '@/types';

export interface ProximaFaturaResumo {
  id: UUID;
  numero: string;
  valor: number;
  dataVencimento: string;
  status: StatusFatura;
  filial: {
    id: UUID;
    razaoSocial: string;
    nomeFantasia: string | null;
  };
}

export interface DashboardClienteResumo {
  totalGasto: number;
  totalEmAberto: number;
  totalVencido: number;
  qtdFaturasEmAberto: number;
  proximas: ProximaFaturaResumo[];
}

export function useDashboardCliente() {
  const filialSelecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  return useQuery<DashboardClienteResumo>({
    queryKey: ['dashboard-cliente', filialSelecionadaId],
    queryFn: () =>
      api.get<DashboardClienteResumo>('/cliente/dashboard', {
        filialId: filialSelecionadaId ?? undefined,
      }),
  });
}
