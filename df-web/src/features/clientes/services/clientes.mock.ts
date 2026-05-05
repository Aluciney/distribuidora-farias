import { StatusCliente, type Cliente, type UUID } from '@/types';
import { apenasDigitos } from '@/utils/cnpj';

const reaisToCentavos = (r: number): number => Math.round(r * 100);

const NOW = '2026-05-05T12:00:00Z';

const SEED: Cliente[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    cnpj: '11444777000161',
    razaoSocial: 'Mercado Central LTDA',
    nomeFantasia: 'Mercado Central',
    inscricaoEstadual: '123.456.789.000',
    email: 'financeiro@mercadocentral.com.br',
    telefone: '11987654321',
    endereco: {
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'Sala 12',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    status: StatusCliente.ATIVO,
    limiteCredito: reaisToCentavos(35_000),
    observacoes: 'Cliente premium - desconto progressivo',
    criadoEm: '2024-08-12T10:00:00Z',
    atualizadoEm: '2026-04-22T14:30:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    cnpj: '34028316000103',
    razaoSocial: 'Padaria Sol Nascente ME',
    nomeFantasia: 'Padaria Sol Nascente',
    email: 'contato@solnascente.com.br',
    telefone: '1133221122',
    endereco: {
      cep: '04567000',
      logradouro: 'Rua das Flores',
      numero: '230',
      bairro: 'Vila Mariana',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    status: StatusCliente.ATIVO,
    limiteCredito: reaisToCentavos(8_000),
    criadoEm: '2025-01-05T09:15:00Z',
    atualizadoEm: '2025-12-19T11:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    cnpj: '60746948000112',
    razaoSocial: 'Restaurante Sabor Caseiro EIRELI',
    nomeFantasia: 'Sabor Caseiro',
    email: 'admin@saborcaseiro.com',
    telefone: '21997774488',
    endereco: {
      cep: '20040020',
      logradouro: 'Rua da Lapa',
      numero: '85',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
    },
    status: StatusCliente.ATIVO,
    limiteCredito: reaisToCentavos(20_000),
    criadoEm: '2024-11-10T08:30:00Z',
    atualizadoEm: '2026-03-04T16:45:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    cnpj: '45283163000158',
    razaoSocial: 'Mercearia do João LTDA',
    nomeFantasia: 'Mercearia do João',
    email: 'joao@merceariadojoao.com.br',
    telefone: '1996541232',
    endereco: {
      cep: '13070000',
      logradouro: 'Av. Brasil',
      numero: '1500',
      bairro: 'Jardim Brasil',
      cidade: 'Campinas',
      uf: 'SP',
    },
    status: StatusCliente.BLOQUEADO,
    limiteCredito: reaisToCentavos(5_000),
    observacoes: 'Bloqueado por inadimplência > 60 dias',
    criadoEm: '2024-04-22T14:00:00Z',
    atualizadoEm: '2026-04-29T10:20:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    cnpj: '07526557000100',
    razaoSocial: 'Empório das Bebidas LTDA',
    nomeFantasia: 'Empório das Bebidas',
    email: 'compras@emporiodasbebidas.com.br',
    telefone: '11955558822',
    endereco: {
      cep: '02123010',
      logradouro: 'Rua Voluntários da Pátria',
      numero: '4488',
      bairro: 'Santana',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    status: StatusCliente.ATIVO,
    limiteCredito: reaisToCentavos(45_000),
    criadoEm: '2023-10-15T10:00:00Z',
    atualizadoEm: '2026-04-30T17:30:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    cnpj: '92814821000142',
    razaoSocial: 'Café & Cia ME',
    nomeFantasia: 'Café & Cia',
    email: 'pedidos@cafeecia.com.br',
    telefone: '1135551200',
    endereco: {
      cep: '05010000',
      logradouro: 'Rua Cardoso de Almeida',
      numero: '725',
      bairro: 'Perdizes',
      cidade: 'São Paulo',
      uf: 'SP',
    },
    status: StatusCliente.INATIVO,
    limiteCredito: reaisToCentavos(3_500),
    criadoEm: '2024-02-08T09:00:00Z',
    atualizadoEm: '2025-09-14T12:00:00Z',
  },
];

let banco: Cliente[] = [...SEED];

const SIMULATED_LATENCY_MS = 350;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

function novoId(): UUID {
  return crypto.randomUUID();
}

export interface FiltrosClientes {
  busca?: string;
  status?: StatusCliente | 'TODOS';
}

export type DadosCliente = Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>;

export const clientesService = {
  async listar(filtros: FiltrosClientes = {}): Promise<Cliente[]> {
    await delay();
    const buscaNorm = (filtros.busca ?? '').trim().toLowerCase();
    const buscaDigitos = apenasDigitos(buscaNorm);
    return banco
      .filter((c) => {
        if (
          filtros.status &&
          filtros.status !== 'TODOS' &&
          c.status !== filtros.status
        ) {
          return false;
        }
        if (!buscaNorm) return true;
        const matchTexto =
          c.razaoSocial.toLowerCase().includes(buscaNorm) ||
          (c.nomeFantasia ?? '').toLowerCase().includes(buscaNorm) ||
          c.email.toLowerCase().includes(buscaNorm);
        const matchCnpj =
          buscaDigitos.length > 0 && c.cnpj.includes(buscaDigitos);
        return matchTexto || matchCnpj;
      })
      .sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial));
  },

  async obter(id: UUID): Promise<Cliente | undefined> {
    await delay();
    return banco.find((c) => c.id === id);
  },

  async criar(dados: DadosCliente): Promise<Cliente> {
    await delay();
    const cnpjLimpo = apenasDigitos(dados.cnpj);
    if (banco.some((c) => c.cnpj === cnpjLimpo)) {
      throw new Error('Já existe um cliente cadastrado com este CNPJ.');
    }
    const novo: Cliente = {
      ...dados,
      cnpj: cnpjLimpo,
      id: novoId(),
      criadoEm: NOW,
      atualizadoEm: NOW,
    };
    banco = [...banco, novo];
    return novo;
  },

  async atualizar(id: UUID, dados: DadosCliente): Promise<Cliente> {
    await delay();
    const idx = banco.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cliente não encontrado.');
    const cnpjLimpo = apenasDigitos(dados.cnpj);
    if (banco.some((c) => c.cnpj === cnpjLimpo && c.id !== id)) {
      throw new Error('Já existe outro cliente com este CNPJ.');
    }
    const atualizado: Cliente = {
      ...banco[idx],
      ...dados,
      cnpj: cnpjLimpo,
      id,
      atualizadoEm: NOW,
    };
    banco = banco.map((c) => (c.id === id ? atualizado : c));
    return atualizado;
  },

  async alterarStatus(id: UUID, status: StatusCliente): Promise<Cliente> {
    await delay();
    const cliente = banco.find((c) => c.id === id);
    if (!cliente) throw new Error('Cliente não encontrado.');
    const atualizado: Cliente = { ...cliente, status, atualizadoEm: NOW };
    banco = banco.map((c) => (c.id === id ? atualizado : c));
    return atualizado;
  },
};
