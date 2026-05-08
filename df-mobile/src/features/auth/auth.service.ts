import { api } from '@/services/http';
import type { FilialAcesso, UsuarioClienteSessao } from '@/types';

interface UsuarioClienteDTO {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  ultimoAcesso: string | null;
  filiais: {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    status: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
    principal: boolean;
  }[];
}

interface RespostaLoginCliente {
  usuarioCliente: UsuarioClienteDTO;
  token: string;
}

interface RespostaEu {
  tipo: 'ADMIN' | 'USUARIO_CLIENTE';
  usuario: { id: string } | null;
  usuarioCliente: UsuarioClienteDTO | null;
}

function fromUsuarioClienteDTO(dto: UsuarioClienteDTO): UsuarioClienteSessao {
  return {
    id: dto.id,
    nome: dto.nome,
    email: dto.email,
    telefone: dto.telefone,
    ativo: dto.ativo,
    ultimoAcesso: dto.ultimoAcesso ?? undefined,
    filiais: dto.filiais.map<FilialAcesso>((f) => ({
      id: f.id,
      cnpj: f.cnpj,
      razaoSocial: f.razaoSocial,
      nomeFantasia: f.nomeFantasia ?? undefined,
      status: f.status,
      principal: f.principal,
    })),
  };
}

export const authService = {
  async loginCliente(payload: { email: string; senha: string }): Promise<{
    token: string;
    usuarioCliente: UsuarioClienteSessao;
  }> {
    const res = await api.post<RespostaLoginCliente>('/auth/login/cliente', {
      email: payload.email.trim().toLowerCase(),
      senha: payload.senha,
    });
    return {
      token: res.token,
      usuarioCliente: fromUsuarioClienteDTO(res.usuarioCliente),
    };
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async eu(): Promise<UsuarioClienteSessao | null> {
    const res = await api.get<RespostaEu>('/auth/eu');
    if (res.tipo !== 'USUARIO_CLIENTE' || !res.usuarioCliente) return null;
    return fromUsuarioClienteDTO(res.usuarioCliente);
  },

  async alterarSenha(payload: { senhaAtual: string; senhaNova: string }) {
    await api.post('/auth/alterar-senha', payload);
  },

  async esqueciSenha(payload: { email: string }) {
    return api.post<{ destinatario: string | null }>('/auth/esqueci-senha', {
      tipo: 'USUARIO_CLIENTE' as const,
      email: payload.email.trim().toLowerCase(),
    });
  },

  async redefinirSenha(payload: {
    email: string;
    codigo: string;
    senhaNova: string;
  }) {
    await api.post('/auth/redefinir-senha', {
      tipo: 'USUARIO_CLIENTE' as const,
      email: payload.email.trim().toLowerCase(),
      codigo: payload.codigo.replace(/\D/g, ''),
      senhaNova: payload.senhaNova,
    });
  },
};

export const SENHA_DEMO = 'df2026';
export const EMAIL_DEMO = 'rede@grupocentral.com.br';
