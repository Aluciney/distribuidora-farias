/**
 * @deprecated Este arquivo mantém o nome `auth.mock.ts` por
 * compatibilidade com os imports existentes. As funções abaixo agora
 * conversam com o backend `df-api` via axios.
 */
import { api } from '@/services/api/http';
import {
  fromUsuarioClienteDTO,
  fromUsuarioDTO,
  type UsuarioClienteDTO,
  type UsuarioDTO,
} from '@/services/api/transformers';
import type { Usuario, UsuarioCliente } from '@/types';

export const SENHA_DEMO = 'df2026';

export interface LoginAdminPayload {
  email: string;
  senha: string;
}

export interface LoginClientePayload {
  email: string;
  senha: string;
}

interface RespostaLoginAdmin {
  usuario: UsuarioDTO;
  token: string;
}

interface RespostaLoginCliente {
  usuarioCliente: UsuarioClienteDTO;
  token: string;
}

interface RespostaEu {
  tipo: 'ADMIN' | 'USUARIO_CLIENTE';
  usuario: UsuarioDTO | null;
  usuarioCliente: UsuarioClienteDTO | null;
}

export const authService = {
  async loginAdmin(payload: LoginAdminPayload): Promise<Usuario> {
    const res = await api.post<RespostaLoginAdmin>('/auth/login/admin', {
      email: payload.email.trim().toLowerCase(),
      senha: payload.senha,
    });
    return fromUsuarioDTO(res.usuario);
  },

  async loginCliente(payload: LoginClientePayload): Promise<UsuarioCliente> {
    const res = await api.post<RespostaLoginCliente>('/auth/login/cliente', {
      email: payload.email.trim().toLowerCase(),
      senha: payload.senha,
    });
    return fromUsuarioClienteDTO(res.usuarioCliente);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async eu(): Promise<RespostaEu> {
    return api.get<RespostaEu>('/auth/eu');
  },

  async alterarSenha(payload: {
    senhaAtual: string;
    senhaNova: string;
  }): Promise<void> {
    await api.post('/auth/alterar-senha', payload);
  },

  async esqueciSenha(payload: {
    tipo: 'ADMIN' | 'USUARIO_CLIENTE';
    email: string;
  }): Promise<{ destinatario: string | null }> {
    return api.post<{ destinatario: string | null }>(
      '/auth/esqueci-senha',
      payload,
    );
  },

  async redefinirSenha(payload: {
    tipo: 'ADMIN' | 'USUARIO_CLIENTE';
    email: string;
    codigo: string;
    senhaNova: string;
  }): Promise<void> {
    await api.post('/auth/redefinir-senha', payload);
  },
};
