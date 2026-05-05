import { useQuery } from '@tanstack/react-query';
import {
  produtosService,
  type FiltrosProdutos,
} from '@/features/produtos/services/produtos.mock';

export function useProdutos(filtros: FiltrosProdutos) {
  return useQuery({
    queryKey: ['produtos', 'lista', filtros],
    queryFn: () => produtosService.listar(filtros),
  });
}
