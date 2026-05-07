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
};

export const SENHA_DEMO = 'df2026';
