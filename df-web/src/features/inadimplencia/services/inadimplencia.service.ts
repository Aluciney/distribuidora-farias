/**
 * Inadimplência: agora bate em `/admin/inadimplencia/{resumo,clientes}`.
 * Os tipos exportados (`FaixaAging`, `FaixaResumo`, `ResumoInadimplencia`,
 * `ClienteEmAtraso`) foram preservados para evitar quebra nos componentes.
 */
import { api } from '@/services/api/http';
import { cobrancasService } from '@/features/cobrancas/services/cobrancas.mock';
import type {
  Cliente,
  Fatura,
  UUID,
  ValorEmCentavos,
} from '@/types';

export type FaixaAging =
  | 'A_VENCER_7D'
  | 'ATRASO_1_15'
  | 'ATRASO_16_30'
  | 'ATRASO_31_60'
  | 'ATRASO_60_MAIS';

export const FAIXAS_AGING_ORDEM: FaixaAging[] = [
  'A_VENCER_7D',
  'ATRASO_1_15',
  'ATRASO_16_30',
  'ATRASO_31_60',
  'ATRASO_60_MAIS',
];

export const FAIXA_LABEL: Record<FaixaAging, string> = {
  A_VENCER_7D: 'A vencer (≤ 7 dias)',
  ATRASO_1_15: 'Atraso 1-15 dias',
  ATRASO_16_30: 'Atraso 16-30 dias',
  ATRASO_31_60: 'Atraso 31-60 dias',
  ATRASO_60_MAIS: 'Atraso 60+ dias',
};

export const FAIXA_TOM: Record<FaixaAging, 'amber' | 'rose' | 'sky' | 'violet'> =
  {
    A_VENCER_7D: 'sky',
    ATRASO_1_15: 'amber',
    ATRASO_16_30: 'amber',
    ATRASO_31_60: 'rose',
    ATRASO_60_MAIS: 'violet',
  };

export interface FaixaResumo {
  faixa: FaixaAging;
  qtdFaturas: number;
  valor: ValorEmCentavos;
}

export interface ResumoInadimplencia {
  totalEmAtraso: ValorEmCentavos;
  qtdClientesInadimplentes: number;
  totalAVencer7Dias: ValorEmCentavos;
  qtdFaturasAVencer7Dias: number;
  ticketMedioAtraso: ValorEmCentavos;
  maiorAtrasoDias: number;
  faixas: FaixaResumo[];
}

export interface ClienteEmAtraso {
  cliente: Pick<Cliente, 'id' | 'cnpj' | 'razaoSocial'>;
  faturas: Fatura[];
  valorVencido: ValorEmCentavos;
  valorAVencer7Dias: ValorEmCentavos;
  diasAtrasoMaximo: number;
  piorFaixa: FaixaAging;
}

interface ResumoBackendDTO {
  totalEmAberto: number;
  totalVencido: number;
  qtdFaturasVencidas: number;
  qtdClientesEmAtraso: number;
  faixas: { faixa: FaixaAging; valor: number; quantidade: number }[];
}

interface ClienteBackendDTO {
  clienteId: UUID;
  razaoSocial: string;
  cnpj: string;
  totalEmAberto: number;
  totalVencido: number;
  qtdFaturas: number;
  maiorAtrasoDias: number;
}

function piorFaixaPorDias(dias: number): FaixaAging {
  if (dias <= 0) return 'A_VENCER_7D';
  if (dias <= 15) return 'ATRASO_1_15';
  if (dias <= 30) return 'ATRASO_16_30';
  if (dias <= 60) return 'ATRASO_31_60';
  return 'ATRASO_60_MAIS';
}

export const inadimplenciaService = {
  async resumo(): Promise<ResumoInadimplencia> {
    const dto = await api.get<ResumoBackendDTO>('/admin/inadimplencia/resumo');
    const faixasMap = new Map<FaixaAging, FaixaResumo>(
      FAIXAS_AGING_ORDEM.map((f) => [f, { faixa: f, qtdFaturas: 0, valor: 0 }]),
    );
    for (const f of dto.faixas) {
      faixasMap.set(f.faixa, { faixa: f.faixa, qtdFaturas: f.quantidade, valor: f.valor });
    }
    const aVencer = faixasMap.get('A_VENCER_7D')!;
    const ticketMedioAtraso =
      dto.qtdFaturasVencidas > 0 ? Math.round(dto.totalVencido / dto.qtdFaturasVencidas) : 0;

    // O backend não retorna "maior atraso em dias" diretamente; deduzimos da pior faixa preenchida.
    let maiorAtrasoDias = 0;
    for (const f of FAIXAS_AGING_ORDEM) {
      const item = faixasMap.get(f)!;
      if (f !== 'A_VENCER_7D' && item.qtdFaturas > 0) {
        if (f === 'ATRASO_1_15') maiorAtrasoDias = Math.max(maiorAtrasoDias, 15);
        else if (f === 'ATRASO_16_30') maiorAtrasoDias = Math.max(maiorAtrasoDias, 30);
        else if (f === 'ATRASO_31_60') maiorAtrasoDias = Math.max(maiorAtrasoDias, 60);
        else if (f === 'ATRASO_60_MAIS') maiorAtrasoDias = Math.max(maiorAtrasoDias, 90);
      }
    }

    return {
      totalEmAtraso: dto.totalVencido,
      qtdClientesInadimplentes: dto.qtdClientesEmAtraso,
      totalAVencer7Dias: aVencer.valor,
      qtdFaturasAVencer7Dias: aVencer.qtdFaturas,
      ticketMedioAtraso,
      maiorAtrasoDias,
      faixas: FAIXAS_AGING_ORDEM.map((f) => faixasMap.get(f)!),
    };
  },

  async listarClientesEmAtraso(): Promise<ClienteEmAtraso[]> {
    const { itens } = await api.get<{ itens: ClienteBackendDTO[] }>(
      '/admin/inadimplencia/clientes',
    );

    // Para preencher `faturas[]` que a tela exibe expandido, buscamos as
    // faturas em aberto de cada cliente em paralelo.
    const detalhes = await Promise.all(
      itens.map(async (c) => {
        const faturasCliente = await cobrancasService.listar({ clienteId: c.clienteId });
        return {
          cliente: { id: c.clienteId, cnpj: c.cnpj, razaoSocial: c.razaoSocial },
          faturas: faturasCliente.itens,
          valorVencido: c.totalVencido,
          valorAVencer7Dias: Math.max(0, c.totalEmAberto - c.totalVencido),
          diasAtrasoMaximo: c.maiorAtrasoDias,
          piorFaixa: piorFaixaPorDias(c.maiorAtrasoDias),
        } satisfies ClienteEmAtraso;
      }),
    );
    return detalhes;
  },
};
