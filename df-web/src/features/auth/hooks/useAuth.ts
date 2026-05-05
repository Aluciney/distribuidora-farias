import { useMutation } from '@tanstack/react-query';
import {
  authService,
  type LoginAdminPayload,
  type LoginClientePayload,
} from '@/features/auth/services/auth.mock';
import { useAuthStore } from '@/store/auth.store';

export function useLoginAdmin() {
  const loginAdmin = useAuthStore((s) => s.loginAdmin);
  return useMutation({
    mutationFn: (payload: LoginAdminPayload) => authService.loginAdmin(payload),
    onSuccess: (usuario) => {
      loginAdmin(usuario.id);
    },
  });
}

export function useLoginCliente() {
  const loginCliente = useAuthStore((s) => s.loginCliente);
  return useMutation({
    mutationFn: (payload: LoginClientePayload) =>
      authService.loginCliente(payload),
    onSuccess: (cliente) => {
      loginCliente(cliente.id);
    },
  });
}
