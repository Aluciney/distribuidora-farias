import { clientesService } from '@/features/clientes/services/clientes.mock';
import { usuariosService } from '@/features/usuarios/services/usuarios.mock';
import { StatusCliente, type Cliente, type Usuario } from '@/types';
import { apenasDigitos } from '@/utils/cnpj';

const SIMULATED_LATENCY_MS = 600;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

/**
 * Senha demo aceita por todos os usuários e clientes. Em produção
 * a verificação seria feita contra hash bcrypt no backend.
 */
export const SENHA_DEMO = 'df2026';

export interface LoginAdminPayload {
  email: string;
  senha: string;
}

export interface LoginClientePayload {
  cnpj: string;
  senha: string;
}

export const authService = {
  async loginAdmin(payload: LoginAdminPayload): Promise<Usuario> {
    await delay();
    if (payload.senha !== SENHA_DEMO) {
      throw new Error('Email ou senha incorretos.');
    }
    const emailNorm = payload.email.trim().toLowerCase();
    const todos = await usuariosService.listar({});
    const usuario = todos.find((u) => u.email.toLowerCase() === emailNorm);
    if (!usuario) {
      throw new Error('Email ou senha incorretos.');
    }
    if (!usuario.ativo) {
      throw new Error(
        'Acesso desativado. Procure o administrador do sistema.',
      );
    }
    return usuario;
  },

  async loginCliente(payload: LoginClientePayload): Promise<Cliente> {
    await delay();
    if (payload.senha !== SENHA_DEMO) {
      throw new Error('CNPJ ou senha incorretos.');
    }
    const cnpjLimpo = apenasDigitos(payload.cnpj);
    const todos = await clientesService.listar({});
    const cliente = todos.find((c) => c.cnpj === cnpjLimpo);
    if (!cliente) {
      throw new Error('CNPJ ou senha incorretos.');
    }
    if (cliente.status === StatusCliente.INATIVO) {
      throw new Error(
        'Cliente inativo. Entre em contato com a Distribuidora Farias.',
      );
    }
    if (cliente.status === StatusCliente.BLOQUEADO) {
      throw new Error(
        'Acesso bloqueado por inadimplência. Procure o financeiro.',
      );
    }
    return cliente;
  },
};
