import { useQuery } from '@tanstack/react-query';
import { inadimplenciaService } from '@/features/inadimplencia/services/inadimplencia.service';

const KEY_BASE = ['inadimplencia'] as const;

export function useResumoInadimplencia() {
  return useQuery({
    queryKey: [...KEY_BASE, 'resumo'],
    queryFn: () => inadimplenciaService.resumo(),
  });
}

export function useClientesEmAtraso() {
  return useQuery({
    queryKey: [...KEY_BASE, 'clientes'],
    queryFn: () => inadimplenciaService.listarClientesEmAtraso(),
  });
}
