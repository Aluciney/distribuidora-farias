import { useMutation } from '@tanstack/react-query';
import { authService } from '@/features/auth/services/auth.mock';
import { toast } from '@/store/toast.store';

export function useAlterarSenha() {
  return useMutation({
    mutationFn: (payload: { senhaAtual: string; senhaNova: string }) =>
      authService.alterarSenha(payload),
    onSuccess: () => {
      toast.sucesso(
        'Senha alterada',
        'Sua nova senha já está ativa.',
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao alterar senha', err.message);
    },
  });
}

export function useEsqueciSenha() {
  return useMutation({
    mutationFn: (payload: {
      tipo: 'ADMIN' | 'CLIENTE';
      identificador: string;
    }) => authService.esqueciSenha(payload),
    onError: (err: Error) => {
      toast.erro('Falha ao solicitar recuperação', err.message);
    },
  });
}

export function useRedefinirSenha() {
  return useMutation({
    mutationFn: (payload: {
      tipo: 'ADMIN' | 'CLIENTE';
      identificador: string;
      codigo: string;
      senhaNova: string;
    }) => authService.redefinirSenha(payload),
    onSuccess: () => {
      toast.sucesso(
        'Senha redefinida',
        'Você já pode entrar com a nova senha.',
      );
    },
    onError: (err: Error) => {
      toast.erro('Falha ao redefinir senha', err.message);
    },
  });
}
