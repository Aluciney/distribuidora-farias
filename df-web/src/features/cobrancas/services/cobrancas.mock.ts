/**
 * @deprecated Mantém o nome original; agora chama o backend df-api via axios.
 */
import { api } from '@/services/api/http';
import { fromFaturaDTO, type FaturaDTO } from '@/services/api/transformers';
import { useAuthStore } from '@/store/auth.store';
import {
  MetodoPagamento,
  StatusFatura,
  type Fatura,
  type ISODateString,
  type UUID,
  type ValorEmCentavos,
} from '@/types';

export type StatusFiltro = StatusFatura | 'TODOS';

export interface FiltrosFaturas {
  busca?: string;
  status?: StatusFiltro;
  /** Restringe ao próprio cliente; usado nos hooks do portal `/cliente`. */
  clienteId?: UUID;
}

export interface NovaCobrancaPayload {
  pedidoId: UUID;
  clienteId: UUID;
  valor: ValorEmCentavos;
  dataVencimento: ISODateString;
  observacoes?: string;
}

export interface BaixaManualPayload {
  dataPagamento: ISODateString;
  metodoPago: typeof MetodoPagamento[keyof typeof MetodoPagamento];
  observacoes?: string;
}

export interface PagamentoCartaoPayload {
  numero: string;
  bandeira: string;
  parcelas: number;
  /** Quando informado, é repassado ao backend. Caso contrário usamos defaults. */
  nomeImpresso?: string;
  validade?: string;
  cvv?: string;
}

const PORTAL_CLIENTE_PORTAS = ['/cliente'] as const;

function ehCliente(): boolean {
  return useAuthStore.getState().tipo === 'CLIENTE';
}

const PAGINA_PADRAO = 1;
const POR_PAGINA_MAX = 1000;

interface ListagemAdminDTO {
  itens: FaturaDTO[];
  total: number;
  pagina: number;
  porPagina: number;
}

interface ListagemClienteDTO {
  itens: FaturaDTO[];
}

function statusParam(status?: StatusFiltro): string | undefined {
  if (!status || status === 'TODOS') return undefined;
  return status;
}

export const cobrancasService = {
  async listar(filtros: FiltrosFaturas = {}): Promise<Fatura[]> {
    if (ehCliente()) {
      const { itens } = await api.get<ListagemClienteDTO>('/cliente/faturas', {
        status: statusParam(filtros.status),
      });
      // Aplica filtro de busca em memória (cliente vê apenas seu portfolio).
      const buscaNorm = (filtros.busca ?? '').trim().toLowerCase();
      return itens
        .map(fromFaturaDTO)
        .filter((f) =>
          buscaNorm
            ? f.numero.toLowerCase().includes(buscaNorm) ||
              (f.cliente?.razaoSocial.toLowerCase().includes(buscaNorm) ?? false)
            : true,
        );
    }

    const { itens } = await api.get<ListagemAdminDTO>('/admin/cobrancas', {
      busca: filtros.busca,
      status: statusParam(filtros.status),
      clienteId: filtros.clienteId,
      pagina: PAGINA_PADRAO,
      porPagina: POR_PAGINA_MAX,
    });
    return itens.map(fromFaturaDTO);
  },

  async obter(id: UUID): Promise<Fatura | undefined> {
    const path = ehCliente() ? `/cliente/faturas/${id}` : `/admin/cobrancas/${id}`;
    try {
      return fromFaturaDTO(await api.get<FaturaDTO>(path));
    } catch {
      return undefined;
    }
  },

  async criar(payload: NovaCobrancaPayload): Promise<Fatura> {
    const dto = await api.post<FaturaDTO>('/admin/cobrancas', {
      pedidoId: payload.pedidoId,
      dataVencimento: payload.dataVencimento,
      valor: payload.valor,
      observacoes: payload.observacoes ?? null,
    });
    return fromFaturaDTO(dto);
  },

  async baixarManual(id: UUID, payload: BaixaManualPayload): Promise<Fatura> {
    const dto = await api.post<FaturaDTO>(`/admin/cobrancas/${id}/baixa-manual`, {
      dataPagamento: payload.dataPagamento,
      metodoPago: payload.metodoPago,
      observacoes: payload.observacoes ?? null,
    });
    return fromFaturaDTO(dto);
  },

  async cancelarFatura(id: UUID, motivo: string): Promise<Fatura> {
    const dto = await api.post<FaturaDTO>(`/admin/cobrancas/${id}/cancelar`, { motivo });
    return fromFaturaDTO(dto);
  },

  async pagarComCartao(id: UUID, payload: PagamentoCartaoPayload): Promise<Fatura> {
    const dto = await api.post<FaturaDTO>(`/cliente/faturas/${id}/pagar-com-cartao`, {
      numero: payload.numero,
      nomeImpresso: payload.nomeImpresso ?? 'TITULAR DO CARTAO',
      validade: payload.validade ?? proximaValidade(),
      cvv: payload.cvv ?? '123',
      parcelas: payload.parcelas,
    });
    return fromFaturaDTO(dto);
  },
};

// Reexports apenas para garantir compat com imports existentes que tipavam constantes.
export { MetodoPagamento, StatusFatura, PORTAL_CLIENTE_PORTAS };

function proximaValidade(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aa = String(d.getFullYear()).slice(2);
  return `${mm}/${aa}`;
}
