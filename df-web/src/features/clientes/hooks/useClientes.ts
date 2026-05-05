import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clientesService,
  type DadosCliente,
  type FiltrosClientes,
} from '@/features/clientes/services/clientes.mock';
import type { Cliente, StatusCliente, UUID } from '@/types';
import { toast } from '@/store/toast.store';

const KEY_BASE = ['clientes'] as const;

export function useClientes(filtros: FiltrosClientes) {
  return useQuery({
    queryKey: [...KEY_BASE, 'lista', filtros],
    queryFn: () => clientesService.listar(filtros),
  });
}

export function useCliente(id: UUID | undefined) {
  return useQuery({
    queryKey: [...KEY_BASE, 'detalhe', id],
    queryFn: () => clientesService.obter(id!),
    enabled: Boolean(id),
  });
}

export function useCriarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: DadosCliente) => clientesService.criar(dados),
    onSuccess: (cliente: Cliente) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        'Cliente cadastrado',
        `${cliente.razaoSocial} foi adicionado com sucesso.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao cadastrar', err.message);
    },
  });
}

export function useAtualizarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: UUID; dados: DadosCliente }) =>
      clientesService.atualizar(id, dados),
    onSuccess: (cliente: Cliente) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        'Cliente atualizado',
        `Os dados de ${cliente.razaoSocial} foram salvos.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao atualizar', err.message);
    },
  });
}

export function useAlterarStatusCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: UUID; status: StatusCliente }) =>
      clientesService.alterarStatus(id, status),
    onSuccess: (cliente: Cliente) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      const labelStatus = {
        ATIVO: 'reativado',
        INATIVO: 'inativado',
        BLOQUEADO: 'bloqueado',
      } as const;
      toast.sucesso(
        'Status alterado',
        `${cliente.razaoSocial} foi ${labelStatus[cliente.status]}.`,
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao alterar status', err.message);
    },
  });
}
