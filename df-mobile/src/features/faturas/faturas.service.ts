import * as FileSystem from 'expo-file-system/legacy';
import { api, baseURL, obterToken } from '@/services/http';
import type {
  Fatura,
  ListagemFaturas,
  StatusFatura,
  UUID,
} from '@/types';

interface FaturaDTO {
  id: string;
  numero: string;
  pedidoId: string;
  clienteId: string;
  cliente: {
    id: string;
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string | null;
  } | null;
  valor: number;
  valorPago: number | null;
  status: StatusFatura;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento: string | null;
  observacoes: string | null;
  boleto: {
    linhaDigitavel: string;
    codigoBarras: string;
    nossoNumero: string;
    url: string | null;
  };
  pix: {
    copiaECola: string;
    qrCode: string;
    txid: string;
    expiraEm: string | null;
  };
  pagamento: {
    metodo: 'BOLETO' | 'PIX' | 'CARTAO_CREDITO' | 'DINHEIRO';
    cartao: {
      bandeira: string;
      ultimosDigitos: string;
      parcelas: number;
      authorizationId: string;
    } | null;
  } | null;
  cancelamento: { motivo: string; canceladoEm: string } | null;
  criadoEm: string;
  atualizadoEm: string;
}

interface ListagemDTO {
  itens: FaturaDTO[];
  total: number;
  pagina: number;
  porPagina: number;
}

function fromFaturaDTO(dto: FaturaDTO): Fatura {
  return {
    id: dto.id,
    numero: dto.numero,
    pedidoId: dto.pedidoId,
    clienteId: dto.clienteId,
    cliente: dto.cliente
      ? {
          id: dto.cliente.id,
          cnpj: dto.cliente.cnpj,
          razaoSocial: dto.cliente.razaoSocial,
          nomeFantasia: dto.cliente.nomeFantasia ?? undefined,
        }
      : undefined,
    valor: dto.valor,
    valorPago: dto.valorPago ?? undefined,
    status: dto.status,
    dataEmissao: dto.dataEmissao,
    dataVencimento: dto.dataVencimento,
    dataPagamento: dto.dataPagamento ?? undefined,
    observacoes: dto.observacoes ?? undefined,
    motivoCancelamento: dto.cancelamento?.motivo,
    boleto: {
      linhaDigitavel: dto.boleto.linhaDigitavel,
      codigoBarras: dto.boleto.codigoBarras,
      nossoNumero: dto.boleto.nossoNumero,
    },
    pix: {
      copiaECola: dto.pix.copiaECola,
      qrCode: dto.pix.qrCode,
      txid: dto.pix.txid,
      expiraEm: dto.pix.expiraEm ?? undefined,
    },
    pagamento: dto.pagamento
      ? {
          metodo: dto.pagamento.metodo,
          cartao: dto.pagamento.cartao
            ? {
                bandeira: dto.pagamento.cartao.bandeira,
                ultimosDigitos: dto.pagamento.cartao.ultimosDigitos,
                parcelas: dto.pagamento.cartao.parcelas,
              }
            : undefined,
        }
      : undefined,
    criadoEm: dto.criadoEm,
    atualizadoEm: dto.atualizadoEm,
  };
}

export interface FiltrosFaturasCliente {
  status?: StatusFatura;
  /** Quando informado, filtra a uma única filial entre as acessíveis. */
  filialId?: UUID;
  pagina?: number;
  porPagina?: number;
}

export interface PagamentoCartaoPayload {
  numero: string;
  nomeImpresso: string;
  validade: string;
  cvv: string;
  parcelas: number;
}

export const faturasService = {
  async listar(filtros: FiltrosFaturasCliente = {}): Promise<ListagemFaturas> {
    const dto = await api.get<ListagemDTO>('/cliente/faturas', {
      status: filtros.status,
      filialId: filtros.filialId,
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
    try {
      return fromFaturaDTO(
        await api.get<FaturaDTO>(`/cliente/faturas/${id}`),
      );
    } catch {
      return undefined;
    }
  },

  async pagarComCartao(
    id: UUID,
    payload: PagamentoCartaoPayload,
  ): Promise<Fatura> {
    const dto = await api.post<FaturaDTO>(
      `/cliente/faturas/${id}/pagar-com-cartao`,
      payload,
    );
    return fromFaturaDTO(dto);
  },

  /** Baixa o PDF do boleto e grava em disco no diretório do app. Retorna o
   *  URI local que pode ser passado para `Sharing.shareAsync`. */
  async baixarPdf(id: UUID, nomeArquivoSugerido?: string): Promise<string> {
    const token = obterToken();
    if (!token) throw new Error('Sessão expirada. Faça login novamente.');

    const destino =
      FileSystem.documentDirectory + (nomeArquivoSugerido ?? `boleto-${id}.pdf`);
    const resultado = await FileSystem.downloadAsync(
      `${baseURL}/cliente/faturas/${id}/pdf`,
      destino,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (resultado.status < 200 || resultado.status >= 300) {
      throw new Error(`Falha ao baixar PDF (status ${resultado.status}).`);
    }
    return resultado.uri;
  },
};
