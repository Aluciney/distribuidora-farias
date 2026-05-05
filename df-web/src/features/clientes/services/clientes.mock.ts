/**
 * @deprecated Mantém o nome original mas chama o backend df-api via axios.
 */
import { api } from '@/services/api/http';
import { fromClienteDTO, type ClienteDTO } from '@/services/api/transformers';
import type { Cliente, StatusCliente, UUID } from '@/types';
import { apenasDigitos } from '@/utils/cnpj';

export interface FiltrosClientes {
  busca?: string;
  status?: StatusCliente | 'TODOS';
}

export type DadosCliente = Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>;

interface ListagemDTO {
  itens: ClienteDTO[];
}

function toBackendBody(dados: DadosCliente) {
  return {
    cnpj: apenasDigitos(dados.cnpj),
    razaoSocial: dados.razaoSocial,
    nomeFantasia: dados.nomeFantasia ?? null,
    inscricaoEstadual: dados.inscricaoEstadual ?? null,
    email: dados.email,
    telefone: dados.telefone,
    limiteCredito: dados.limiteCredito,
    observacoes: dados.observacoes ?? null,
    status: dados.status,
    endereco: {
      cep: dados.endereco.cep,
      logradouro: dados.endereco.logradouro,
      numero: dados.endereco.numero,
      complemento: dados.endereco.complemento ?? null,
      bairro: dados.endereco.bairro,
      cidade: dados.endereco.cidade,
      uf: dados.endereco.uf.toUpperCase(),
    },
  };
}

export const clientesService = {
  async listar(filtros: FiltrosClientes = {}): Promise<Cliente[]> {
    const { itens } = await api.get<ListagemDTO>('/admin/clientes', {
      busca: filtros.busca,
      status: filtros.status && filtros.status !== 'TODOS' ? filtros.status : undefined,
    });
    return itens.map(fromClienteDTO);
  },

  async obter(id: UUID): Promise<Cliente | undefined> {
    try {
      return fromClienteDTO(await api.get<ClienteDTO>(`/admin/clientes/${id}`));
    } catch {
      return undefined;
    }
  },

  async criar(dados: DadosCliente): Promise<Cliente> {
    return fromClienteDTO(await api.post<ClienteDTO>('/admin/clientes', toBackendBody(dados)));
  },

  async atualizar(_id: UUID, dados: DadosCliente): Promise<Cliente> {
    // CNPJ é imutável no backend; o body de PUT ignora `cnpj` lá.
    const { cnpj: _cnpj, ...resto } = toBackendBody(dados);
    return fromClienteDTO(await api.put<ClienteDTO>(`/admin/clientes/${_id}`, resto));
  },

  async alterarStatus(id: UUID, status: StatusCliente): Promise<Cliente> {
    return fromClienteDTO(await api.patch<ClienteDTO>(`/admin/clientes/${id}/status`, { status }));
  },
};
