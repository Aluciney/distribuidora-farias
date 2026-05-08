import { useQuery } from '@tanstack/react-query';
import {
  cobrancasService,
  type ListagemFaturas,
} from '@/features/cobrancas/services/cobrancas.mock';
import { useAuthStore } from '@/store/auth.store';
import type { StatusFatura, UUID } from '@/types';

interface FiltrosClienteFaturas {
  status?: StatusFatura | 'TODOS';
  pagina?: number;
  porPagina?: number;
  /**
   * Override explícito da filial usada na consulta. Quando omitido, usa a
   * `filialSelecionadaId` do `auth.store` (com fallback para "todas").
   */
  filialId?: UUID | null;
}

const VAZIO: ListagemFaturas = { itens: [], total: 0, pagina: 1, porPagina: 10 };

export function useFaturasCliente(filtros: FiltrosClienteFaturas = {}) {
  const usuarioClienteId = useAuthStore((s) => s.usuarioClienteId);
  const filialSelecionadaId = useAuthStore((s) => s.filialSelecionadaId);
  const filialEfetivaId =
    filtros.filialId !== undefined ? filtros.filialId : filialSelecionadaId;

  return useQuery<ListagemFaturas>({
    queryKey: [
      'cliente-faturas',
      usuarioClienteId,
      filialEfetivaId,
      filtros.status,
      filtros.pagina,
      filtros.porPagina,
    ],
    queryFn: () =>
      usuarioClienteId
        ? cobrancasService.listar({
            filialId: filialEfetivaId ?? undefined,
            status: filtros.status,
            pagina: filtros.pagina,
            porPagina: filtros.porPagina,
          })
        : Promise.resolve(VAZIO),
    enabled: Boolean(usuarioClienteId),
  });
}
