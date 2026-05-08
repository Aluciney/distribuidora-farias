/**
 * @deprecated Mantém o nome original; agora chama df-api via axios.
 */
import { api } from '@/services/api/http';
import { fromUsuarioDTO, type UsuarioDTO } from '@/services/api/transformers';
import { type PerfilUsuario, type Usuario, type UUID } from '@/types';

export interface FiltrosUsuarios {
  busca?: string;
  perfil?: PerfilUsuario | 'TODOS';
  ativo?: boolean | 'TODOS';
  pagina?: number;
  porPagina?: number;
}

export interface ListagemUsuarios {
  itens: Usuario[];
  total: number;
  pagina: number;
  porPagina: number;
}

export type DadosUsuario = Omit<Usuario, 'id' | 'criadoEm' | 'ultimoAcesso'>;

interface ListagemDTO {
  itens: UsuarioDTO[];
  total: number;
  pagina: number;
  porPagina: number;
}

export const usuariosService = {
  async listar(filtros: FiltrosUsuarios = {}): Promise<ListagemUsuarios> {
    const perfil =
      filtros.perfil && filtros.perfil !== 'TODOS' ? filtros.perfil : undefined;
    const ativo =
      filtros.ativo === undefined || filtros.ativo === 'TODOS'
        ? undefined
        : String(filtros.ativo);
    const dto = await api.get<ListagemDTO>('/admin/usuarios', {
      busca: filtros.busca,
      perfil,
      ativo,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    });
    return {
      itens: dto.itens.map(fromUsuarioDTO),
      total: dto.total,
      pagina: dto.pagina,
      porPagina: dto.porPagina,
    };
  },

  async obter(id: UUID): Promise<Usuario | undefined> {
    try {
      return fromUsuarioDTO(await api.get<UsuarioDTO>(`/admin/usuarios/${id}`));
    } catch {
      return undefined;
    }
  },

  async criar(dados: DadosUsuario): Promise<Usuario> {
    const dto = await api.post<UsuarioDTO>('/admin/usuarios', {
      nome: dados.nome,
      email: dados.email.trim().toLowerCase(),
      perfil: dados.perfil,
      ativo: dados.ativo,
    });
    return fromUsuarioDTO(dto);
  },

  async atualizar(id: UUID, dados: DadosUsuario): Promise<Usuario> {
    const dto = await api.put<UsuarioDTO>(`/admin/usuarios/${id}`, {
      nome: dados.nome,
      email: dados.email.trim().toLowerCase(),
      perfil: dados.perfil,
      ativo: dados.ativo,
    });
    return fromUsuarioDTO(dto);
  },

  async alternarAtivo(id: UUID): Promise<Usuario> {
    const atual = await this.obter(id);
    if (!atual) throw new Error('Usuário não encontrado.');
    const dto = await api.patch<UsuarioDTO>(`/admin/usuarios/${id}/ativo`, { ativo: !atual.ativo });
    return fromUsuarioDTO(dto);
  },
};
