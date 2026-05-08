import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  usuariosClienteService,
  type AtualizarUsuarioClienteInput,
  type CriarUsuarioClienteInput,
  type FiltrosUsuariosCliente,
} from '@/features/usuarios-cliente/services/usuariosCliente.service';
import { toast } from '@/store/toast.store';
import type { UUID, UsuarioCliente } from '@/types';

const KEY_BASE = ['usuarios-cliente'] as const;

export function useUsuariosCliente(filtros: FiltrosUsuariosCliente) {
  return useQuery({
    queryKey: [...KEY_BASE, 'lista', filtros],
    queryFn: () => usuariosClienteService.listar(filtros),
  });
}

export function useUsuarioCliente(id: UUID | undefined) {
  return useQuery({
    queryKey: [...KEY_BASE, 'detalhe', id],
    queryFn: () => usuariosClienteService.obter(id!),
    enabled: Boolean(id),
  });
}

export function useCriarUsuarioCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarUsuarioClienteInput) => usuariosClienteService.criar(input),
    onSuccess: (u: UsuarioCliente) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        'Usuário cliente criado',
        `Convite enviado para ${u.email}.`,
      );
    },
    onError: (err: Error) => toast.erro('Falha ao criar', err.message),
  });
}

export function useAtualizarUsuarioCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: UUID; input: AtualizarUsuarioClienteInput }) =>
      usuariosClienteService.atualizar(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso('Atualizado', 'Dados salvos com sucesso.');
    },
    onError: (err: Error) => toast.erro('Falha ao atualizar', err.message),
  });
}

export function useReenviarConvite() {
  return useMutation({
    mutationFn: (id: UUID) => usuariosClienteService.reenviarConvite(id),
    onSuccess: (r) => {
      toast.sucesso('Convite reenviado', `Email enviado para ${r.destinatario}.`);
    },
    onError: (err: Error) => toast.erro('Falha ao reenviar', err.message),
  });
}

export function useVincularFilial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      clienteId,
      principal,
    }: {
      id: UUID;
      clienteId: UUID;
      principal?: boolean;
    }) => usuariosClienteService.vincularFilial(id, clienteId, principal),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_BASE }),
    onError: (err: Error) => toast.erro('Falha ao vincular filial', err.message),
  });
}

export function useDesvincularFilial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clienteId }: { id: UUID; clienteId: UUID }) =>
      usuariosClienteService.desvincularFilial(id, clienteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_BASE }),
    onError: (err: Error) => toast.erro('Falha ao desvincular', err.message),
  });
}

export function useDefinirFilialPrincipal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clienteId }: { id: UUID; clienteId: UUID }) =>
      usuariosClienteService.definirFilialPrincipal(id, clienteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY_BASE }),
    onError: (err: Error) => toast.erro('Falha ao definir sede', err.message),
  });
}
