import { api } from '@/services/api/http';
import {
  fromUsuarioClienteDTO,
  type UsuarioClienteDTO,
} from '@/services/api/transformers';
import type { UUID, UsuarioCliente } from '@/types';

export interface FiltrosUsuariosCliente {
  busca?: string;
  ativo?: boolean | 'TODOS';
  pagina?: number;
  porPagina?: number;
}

export interface ListagemUsuariosCliente {
  itens: UsuarioCliente[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface CriarUsuarioClienteInput {
  nome: string;
  email: string;
  telefone: string;
  filialPrincipalId: UUID;
  filiaisIds?: UUID[];
  enviarConvite?: boolean;
}

export interface AtualizarUsuarioClienteInput {
  nome?: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
}

interface ListagemDTO {
  itens: UsuarioClienteDTO[];
  total: number;
  pagina: number;
  porPagina: number;
}

export const usuariosClienteService = {
  async listar(filtros: FiltrosUsuariosCliente = {}): Promise<ListagemUsuariosCliente> {
    const ativo =
      filtros.ativo === undefined || filtros.ativo === 'TODOS'
        ? undefined
        : String(filtros.ativo);
    const dto = await api.get<ListagemDTO>('/admin/usuarios-cliente', {
      busca: filtros.busca,
      ativo,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    });
    return {
      itens: dto.itens.map(fromUsuarioClienteDTO),
      total: dto.total,
      pagina: dto.pagina,
      porPagina: dto.porPagina,
    };
  },

  async obter(id: UUID): Promise<UsuarioCliente | undefined> {
    try {
      return fromUsuarioClienteDTO(
        await api.get<UsuarioClienteDTO>(`/admin/usuarios-cliente/${id}`),
      );
    } catch {
      return undefined;
    }
  },

  async criar(input: CriarUsuarioClienteInput): Promise<UsuarioCliente> {
    const dto = await api.post<UsuarioClienteDTO>('/admin/usuarios-cliente', {
      nome: input.nome,
      email: input.email.trim().toLowerCase(),
      telefone: input.telefone.replace(/\D/g, ''),
      filialPrincipalId: input.filialPrincipalId,
      filiaisIds: input.filiaisIds ?? [],
      enviarConvite: input.enviarConvite ?? true,
    });
    return fromUsuarioClienteDTO(dto);
  },

  async atualizar(
    id: UUID,
    input: AtualizarUsuarioClienteInput,
  ): Promise<UsuarioCliente> {
    const dto = await api.patch<UsuarioClienteDTO>(
      `/admin/usuarios-cliente/${id}`,
      {
        nome: input.nome,
        email: input.email ? input.email.trim().toLowerCase() : undefined,
        telefone: input.telefone ? input.telefone.replace(/\D/g, '') : undefined,
        ativo: input.ativo,
      },
    );
    return fromUsuarioClienteDTO(dto);
  },

  async reenviarConvite(id: UUID): Promise<{ destinatario: string }> {
    return api.post<{ destinatario: string }>(
      `/admin/usuarios-cliente/${id}/reenviar-convite`,
    );
  },

  async vincularFilial(
    id: UUID,
    clienteId: UUID,
    principal = false,
  ): Promise<UsuarioCliente> {
    const dto = await api.post<UsuarioClienteDTO>(
      `/admin/usuarios-cliente/${id}/filiais`,
      { clienteId, principal },
    );
    return fromUsuarioClienteDTO(dto);
  },

  async desvincularFilial(id: UUID, clienteId: UUID): Promise<UsuarioCliente> {
    const dto = await api.delete<UsuarioClienteDTO>(
      `/admin/usuarios-cliente/${id}/filiais/${clienteId}`,
    );
    return fromUsuarioClienteDTO(dto);
  },

  async definirFilialPrincipal(id: UUID, clienteId: UUID): Promise<UsuarioCliente> {
    const dto = await api.patch<UsuarioClienteDTO>(
      `/admin/usuarios-cliente/${id}/filiais/${clienteId}/principal`,
      {},
    );
    return fromUsuarioClienteDTO(dto);
  },
};
