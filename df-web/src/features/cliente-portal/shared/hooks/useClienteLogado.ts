import { useQuery } from '@tanstack/react-query';
import { clientesService } from '@/features/clientes/services/clientes.mock';
import { useAuthStore } from '@/store/auth.store';

/**
 * Resolve o objeto `Cliente` correspondente ao `clienteId` na sessão mockada.
 * Use no portal `/cliente/*` para obter dados como razão social, CNPJ etc.
 */
export function useClienteLogado() {
  const clienteId = useAuthStore((s) => s.clienteId);
  return useQuery({
    queryKey: ['cliente-logado', clienteId],
    queryFn: () => (clienteId ? clientesService.obter(clienteId) : null),
    enabled: Boolean(clienteId),
  });
}
