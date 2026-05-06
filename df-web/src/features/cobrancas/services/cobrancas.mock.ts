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
  pagina?: number;
  porPagina?: number;
}

export interface ListagemFaturas {
  itens: Fatura[];
  total: number;
  pagina: number;
  porPagina: number;
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

interface ListagemDTO {
  itens: FaturaDTO[];
  total: number;
  pagina: number;
  porPagina: number;
}

function statusParam(status?: StatusFiltro): string | undefined {
  if (!status || status === 'TODOS') return undefined;
  return status;
}

export const cobrancasService = {
  async listar(filtros: FiltrosFaturas = {}): Promise<ListagemFaturas> {
    const path = ehCliente() ? '/cliente/faturas' : '/admin/cobrancas';
    const dto = await api.get<ListagemDTO>(path, {
      busca: ehCliente() ? undefined : filtros.busca,
      status: statusParam(filtros.status),
      clienteId: ehCliente() ? undefined : filtros.clienteId,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    });
    return {
      itens: dto.itens.map(fromFaturaDTO),
      total: dto.total,
      pagina: dto.pagina,
      porPagina: dto.porPagina,
    };
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
