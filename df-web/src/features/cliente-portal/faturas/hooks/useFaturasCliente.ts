import { useQuery } from '@tanstack/react-query';
import {
  cobrancasService,
  type ListagemFaturas,
} from '@/features/cobrancas/services/cobrancas.mock';
import { useAuthStore } from '@/store/auth.store';
import type { StatusFatura } from '@/types';

interface FiltrosClienteFaturas {
  status?: StatusFatura | 'TODOS';
  pagina?: number;
  porPagina?: number;
}

const VAZIO: ListagemFaturas = { itens: [], total: 0, pagina: 1, porPagina: 10 };

export function useFaturasCliente(filtros: FiltrosClienteFaturas = {}) {
  const clienteId = useAuthStore((s) => s.clienteId);
  return useQuery<ListagemFaturas>({
    queryKey: ['cliente-faturas', clienteId, filtros],
    queryFn: () =>
      clienteId
        ? cobrancasService.listar({ clienteId, ...filtros })
        : Promise.resolve(VAZIO),
    enabled: Boolean(clienteId),
  });
}
