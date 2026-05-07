import { api } from '@/services/http';
import { apenasDigitos } from '@/lib/format';
import type { ClienteSessao } from '@/types';

interface RespostaLoginCliente {
  cliente: ClienteSessao;
  token: string;
}

interface RespostaEu {
  tipo: 'ADMIN' | 'CLIENTE';
  usuario: { id: string } | null;
  cliente: ClienteSessao | null;
}

export const authService = {
  async loginCliente(payload: { cnpj: string; senha: string }) {
    const cnpj = apenasDigitos(payload.cnpj);
    return api.post<RespostaLoginCliente>('/auth/login/cliente', {
      cnpj,
      senha: payload.senha,
    });
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async eu() {
    return api.get<RespostaEu>('/auth/eu');
  },

  async alterarSenha(payload: { senhaAtual: string; senhaNova: string }) {
    await api.post('/auth/alterar-senha', payload);
  },

  async esqueciSenha(payload: { cnpj: string }) {
    return api.post<{ destinatario: string | null }>('/auth/esqueci-senha', {
      tipo: 'CLIENTE' as const,
      identificador: apenasDigitos(payload.cnpj),
    });
  },

  async redefinirSenha(payload: {
    cnpj: string;
    codigo: string;
    senhaNova: string;
  }) {
    await api.post('/auth/redefinir-senha', {
      tipo: 'CLIENTE' as const,
      identificador: apenasDigitos(payload.cnpj),
      codigo: apenasDigitos(payload.codigo),
      senhaNova: payload.senhaNova,
    });
  },
};

export const SENHA_DEMO = 'df2026';
