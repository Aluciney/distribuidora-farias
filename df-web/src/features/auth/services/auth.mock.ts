/**
 * @deprecated Este arquivo mantém o nome `auth.mock.ts` por
 * compatibilidade com os imports existentes. As funções abaixo agora
 * conversam com o backend `df-api` via axios.
 */
import { api } from '@/services/api/http';
import {
  fromUsuarioDTO,
  type UsuarioDTO,
} from '@/services/api/transformers';
import type { Cliente, Usuario } from '@/types';
import { apenasDigitos } from '@/utils/cnpj';

export const SENHA_DEMO = 'df2026';

export interface LoginAdminPayload {
  email: string;
  senha: string;
}

export interface LoginClientePayload {
  cnpj: string;
  senha: string;
}

interface RespostaLoginAdmin {
  usuario: UsuarioDTO;
  token: string;
}

interface RespostaLoginCliente {
  cliente: {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    email: string;
    status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  };
  token: string;
}

interface ClienteResumoDTO {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  email: string;
  status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
}

interface RespostaEu {
  tipo: 'ADMIN' | 'CLIENTE';
  usuario: UsuarioDTO | null;
  cliente: ClienteResumoDTO | null;
}

function clienteFromResumo(r: ClienteResumoDTO): Cliente {
  return {
    id: r.id,
    cnpj: r.cnpj,
    razaoSocial: r.razaoSocial,
    nomeFantasia: r.nomeFantasia ?? undefined,
    email: r.email,
    telefone: '',
    endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' },
    status: r.status,
    limiteCredito: 0,
    criadoEm: '',
    atualizadoEm: '',
  };
}

export const authService = {
  async loginAdmin(payload: LoginAdminPayload): Promise<Usuario> {
    const res = await api.post<RespostaLoginAdmin>('/auth/login/admin', {
      email: payload.email.trim().toLowerCase(),
      senha: payload.senha,
    });
    return fromUsuarioDTO(res.usuario);
  },

  async loginCliente(payload: LoginClientePayload): Promise<Cliente> {
    const cnpj = apenasDigitos(payload.cnpj);
    const res = await api.post<RespostaLoginCliente>('/auth/login/cliente', {
      cnpj,
      senha: payload.senha,
    });
    // /auth/eu confirma o resumo da sessão (mesmo shape do login)
    const eu = await api.get<RespostaEu>('/auth/eu');
    return clienteFromResumo(eu.cliente ?? res.cliente);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async eu(): Promise<RespostaEu> {
    return api.get<RespostaEu>('/auth/eu');
  },
};
