import { PerfilUsuario, type Usuario, type UUID } from '@/types';

const NOW = '2026-05-05T12:00:00Z';

const SEED: Usuario[] = [
  {
    id: 'usr-001',
    nome: 'Aluciney Wanderley',
    email: 'aluciney.wanderley@distribuidorafarias.com.br',
    perfil: PerfilUsuario.ADMIN,
    ativo: true,
    ultimoAcesso: '2026-05-05T11:42:00Z',
    criadoEm: '2024-08-01T09:00:00Z',
  },
  {
    id: 'usr-002',
    nome: 'Marina Costa',
    email: 'marina.costa@distribuidorafarias.com.br',
    perfil: PerfilUsuario.FINANCEIRO,
    ativo: true,
    ultimoAcesso: '2026-05-05T08:30:00Z',
    criadoEm: '2024-09-15T10:00:00Z',
  },
  {
    id: 'usr-003',
    nome: 'Rafael Almeida',
    email: 'rafael.almeida@distribuidorafarias.com.br',
    perfil: PerfilUsuario.FINANCEIRO,
    ativo: true,
    ultimoAcesso: '2026-05-04T17:55:00Z',
    criadoEm: '2025-01-22T14:00:00Z',
  },
  {
    id: 'usr-004',
    nome: 'Patrícia Lima',
    email: 'patricia.lima@distribuidorafarias.com.br',
    perfil: PerfilUsuario.FINANCEIRO,
    ativo: false,
    ultimoAcesso: '2025-12-12T09:20:00Z',
    criadoEm: '2025-03-10T08:30:00Z',
  },
];

let banco: Usuario[] = [...SEED];

const SIMULATED_LATENCY_MS = 300;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

export interface FiltrosUsuarios {
  busca?: string;
  perfil?: PerfilUsuario | 'TODOS';
  ativo?: boolean | 'TODOS';
}

export type DadosUsuario = Omit<
  Usuario,
  'id' | 'criadoEm' | 'ultimoAcesso'
>;

export const usuariosService = {
  async listar(filtros: FiltrosUsuarios = {}): Promise<Usuario[]> {
    await delay();
    const buscaNorm = (filtros.busca ?? '').trim().toLowerCase();
    return banco
      .filter((u) => {
        if (
          filtros.perfil &&
          filtros.perfil !== 'TODOS' &&
          u.perfil !== filtros.perfil
        ) {
          return false;
        }
        if (
          filtros.ativo !== undefined &&
          filtros.ativo !== 'TODOS' &&
          u.ativo !== filtros.ativo
        ) {
          return false;
        }
        if (!buscaNorm) return true;
        return (
          u.nome.toLowerCase().includes(buscaNorm) ||
          u.email.toLowerCase().includes(buscaNorm)
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  },

  async obter(id: UUID): Promise<Usuario | undefined> {
    await delay();
    return banco.find((u) => u.id === id);
  },

  async criar(dados: DadosUsuario): Promise<Usuario> {
    await delay();
    const emailNorm = dados.email.trim().toLowerCase();
    if (banco.some((u) => u.email.toLowerCase() === emailNorm)) {
      throw new Error('Já existe um usuário com este email.');
    }
    const novo: Usuario = {
      ...dados,
      email: emailNorm,
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      criadoEm: NOW,
    };
    banco = [...banco, novo];
    return novo;
  },

  async atualizar(id: UUID, dados: DadosUsuario): Promise<Usuario> {
    await delay();
    const idx = banco.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado.');
    const emailNorm = dados.email.trim().toLowerCase();
    if (banco.some((u) => u.email.toLowerCase() === emailNorm && u.id !== id)) {
      throw new Error('Já existe outro usuário com este email.');
    }
    const atualizado: Usuario = {
      ...banco[idx],
      ...dados,
      email: emailNorm,
      id,
    };
    banco = banco.map((u) => (u.id === id ? atualizado : u));
    return atualizado;
  },

  async alternarAtivo(id: UUID): Promise<Usuario> {
    await delay();
    const atual = banco.find((u) => u.id === id);
    if (!atual) throw new Error('Usuário não encontrado.');
    const atualizado: Usuario = { ...atual, ativo: !atual.ativo };
    banco = banco.map((u) => (u.id === id ? atualizado : u));
    return atualizado;
  },
};
