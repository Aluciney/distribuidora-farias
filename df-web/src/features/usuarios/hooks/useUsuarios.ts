import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  usuariosService,
  type DadosUsuario,
  type FiltrosUsuarios,
} from '@/features/usuarios/services/usuarios.mock';
import type { Usuario, UUID } from '@/types';
import { toast } from '@/store/toast.store';

const KEY_BASE = ['usuarios'] as const;

export function useUsuarios(filtros: FiltrosUsuarios) {
  return useQuery({
    queryKey: [...KEY_BASE, 'lista', filtros],
    queryFn: () => usuariosService.listar(filtros),
  });
}

export function useCriarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: DadosUsuario) => usuariosService.criar(dados),
    onSuccess: (u: Usuario) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso('Usuário criado', `${u.nome} agora tem acesso ao sistema.`);
    },
    onError: (err: Error) => toast.erro('Falha ao criar usuário', err.message),
  });
}

export function useAtualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: UUID; dados: DadosUsuario }) =>
      usuariosService.atualizar(id, dados),
    onSuccess: (u: Usuario) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso('Usuário atualizado', `${u.nome} foi salvo.`);
    },
    onError: (err: Error) =>
      toast.erro('Falha ao atualizar usuário', err.message),
  });
}

export function useAlternarUsuarioAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => usuariosService.alternarAtivo(id),
    onSuccess: (u: Usuario) => {
      qc.invalidateQueries({ queryKey: KEY_BASE });
      toast.sucesso(
        u.ativo ? 'Usuário ativado' : 'Usuário desativado',
        u.nome,
      );
    },
    onError: (err: Error) =>
      toast.erro('Falha ao alterar status', err.message),
  });
}
