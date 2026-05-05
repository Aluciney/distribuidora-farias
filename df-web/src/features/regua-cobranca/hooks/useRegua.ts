import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  reguaService,
  type DadosRegra,
} from '@/features/regua-cobranca/services/regua.mock';
import type { RegraCobranca, UUID } from '@/types';
import { toast } from '@/store/toast.store';

const KEY_BASE = ['regua-cobranca'] as const;

export function useRegras() {
  return useQuery({
    queryKey: [...KEY_BASE, 'lista'],
    queryFn: () => reguaService.listar(),
  });
}

export function useCriarRegra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: DadosRegra) => reguaService.criar(dados),
    onSuccess: (regra: RegraCobranca) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso('Regra criada', `${regra.nome} foi adicionada à régua.`);
    },
    onError: (err: Error) => toast.erro('Falha ao criar regra', err.message),
  });
}

export function useAtualizarRegra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: UUID; dados: DadosRegra }) =>
      reguaService.atualizar(id, dados),
    onSuccess: (regra: RegraCobranca) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso('Regra atualizada', `${regra.nome} foi salva.`);
    },
    onError: (err: Error) =>
      toast.erro('Falha ao atualizar regra', err.message),
  });
}

export function useAlternarRegraAtiva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => reguaService.alternarAtivo(id),
    onSuccess: (regra: RegraCobranca) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        regra.ativo ? 'Regra ativada' : 'Regra desativada',
        regra.nome,
      );
    },
    onError: (err: Error) =>
      toast.erro('Falha ao alterar status', err.message),
  });
}

export function useExcluirRegra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => reguaService.excluir(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso('Regra excluída', 'A regra foi removida da régua.');
    },
    onError: (err: Error) => toast.erro('Falha ao excluir', err.message),
  });
}
