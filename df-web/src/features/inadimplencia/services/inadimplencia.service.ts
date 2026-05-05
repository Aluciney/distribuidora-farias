import { cobrancasService } from '@/features/cobrancas/services/cobrancas.mock';
import {
  StatusFatura,
  type Cliente,
  type Fatura,
  type UUID,
  type ValorEmCentavos,
} from '@/types';

/**
 * Em produção este serviço seria um endpoint dedicado no backend
 * (ex: `GET /relatorios/inadimplencia`). Aqui agregamos a partir do mock
 * de cobranças para manter coerência entre os módulos.
 */

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
  /** Total apenas de faturas vencidas (não inclui "a vencer"). */
  totalEmAtraso: ValorEmCentavos;
  /** Quantidade de clientes únicos com pelo menos uma fatura vencida. */
  qtdClientesInadimplentes: number;
  /** Total de faturas com vencimento ≤ 7 dias e ainda pendentes. */
  totalAVencer7Dias: ValorEmCentavos;
  /** Quantidade de faturas a vencer no horizonte de 7 dias. */
  qtdFaturasAVencer7Dias: number;
  /** Ticket médio considerando faturas em atraso. */
  ticketMedioAtraso: ValorEmCentavos;
  /** Maior atraso (em dias) presente na carteira. */
  maiorAtrasoDias: number;
  /** Distribuição por faixas de aging (inclui a vencer e atrasos). */
  faixas: FaixaResumo[];
}

export interface ClienteEmAtraso {
  cliente: Pick<Cliente, 'id' | 'cnpj' | 'razaoSocial'>;
  faturas: Fatura[];
  valorVencido: ValorEmCentavos;
  valorAVencer7Dias: ValorEmCentavos;
  /** Atraso máximo (em dias) considerando suas faturas vencidas. */
  diasAtrasoMaximo: number;
  /** Pior faixa de aging em que o cliente se enquadra. */
  piorFaixa: FaixaAging;
}

const MS_DIA = 24 * 60 * 60 * 1000;
const HOJE_ISO = '2026-05-05T12:00:00Z';
const HOJE_MS = new Date(HOJE_ISO).getTime();

function diasAteHoje(iso: string): number {
  return Math.floor((HOJE_MS - new Date(iso).getTime()) / MS_DIA);
}

function classificarFaixa(diasAtraso: number): FaixaAging {
  if (diasAtraso <= 0) return 'A_VENCER_7D';
  if (diasAtraso <= 15) return 'ATRASO_1_15';
  if (diasAtraso <= 30) return 'ATRASO_16_30';
  if (diasAtraso <= 60) return 'ATRASO_31_60';
  return 'ATRASO_60_MAIS';
}

function piorFaixaEntre(faixas: FaixaAging[]): FaixaAging {
  for (let i = FAIXAS_AGING_ORDEM.length - 1; i >= 0; i--) {
    const candidata = FAIXAS_AGING_ORDEM[i];
    if (faixas.includes(candidata)) return candidata;
  }
  return 'A_VENCER_7D';
}

function isAtraso(f: Fatura): boolean {
  return (
    (f.status === StatusFatura.VENCIDO ||
      (f.status === StatusFatura.PENDENTE &&
        new Date(f.dataVencimento).getTime() < HOJE_MS))
  );
}

function isAVencer7Dias(f: Fatura): boolean {
  if (f.status !== StatusFatura.PENDENTE) return false;
  const dias = diasAteHoje(f.dataVencimento);
  return dias <= 0 && dias >= -7;
}

async function carregarRelevantes(): Promise<Fatura[]> {
  const todas = await cobrancasService.listar({ status: 'TODOS' });
  return todas.filter((f) => isAtraso(f) || isAVencer7Dias(f));
}

export const inadimplenciaService = {
  async resumo(): Promise<ResumoInadimplencia> {
    const faturas = await carregarRelevantes();

    const faixasMap = new Map<FaixaAging, FaixaResumo>(
      FAIXAS_AGING_ORDEM.map((f) => [
        f,
        { faixa: f, qtdFaturas: 0, valor: 0 },
      ]),
    );

    let totalEmAtraso = 0;
    let totalAVencer7Dias = 0;
    let qtdFaturasAVencer = 0;
    let qtdAtraso = 0;
    let maiorAtrasoDias = 0;
    const clientesEmAtraso = new Set<UUID>();

    for (const f of faturas) {
      const dias = diasAteHoje(f.dataVencimento);
      const faixa = classificarFaixa(dias);
      const slot = faixasMap.get(faixa)!;
      slot.qtdFaturas += 1;
      slot.valor += f.valor;

      if (dias > 0) {
        totalEmAtraso += f.valor;
        qtdAtraso += 1;
        clientesEmAtraso.add(f.clienteId);
        if (dias > maiorAtrasoDias) maiorAtrasoDias = dias;
      } else {
        totalAVencer7Dias += f.valor;
        qtdFaturasAVencer += 1;
      }
    }

    const ticketMedioAtraso =
      qtdAtraso > 0 ? Math.round(totalEmAtraso / qtdAtraso) : 0;

    return {
      totalEmAtraso,
      qtdClientesInadimplentes: clientesEmAtraso.size,
      totalAVencer7Dias,
      qtdFaturasAVencer7Dias: qtdFaturasAVencer,
      ticketMedioAtraso,
      maiorAtrasoDias,
      faixas: FAIXAS_AGING_ORDEM.map((f) => faixasMap.get(f)!),
    };
  },

  async listarClientesEmAtraso(): Promise<ClienteEmAtraso[]> {
    const faturas = await carregarRelevantes();
    const agrupado = new Map<UUID, ClienteEmAtraso>();

    for (const f of faturas) {
      const dias = diasAteHoje(f.dataVencimento);
      const faixa = classificarFaixa(dias);
      const clienteInfo = f.cliente;
      if (!clienteInfo) continue;

      const existente = agrupado.get(clienteInfo.id);
      if (existente) {
        existente.faturas.push(f);
        if (dias > 0) {
          existente.valorVencido += f.valor;
          if (dias > existente.diasAtrasoMaximo) {
            existente.diasAtrasoMaximo = dias;
          }
        } else {
          existente.valorAVencer7Dias += f.valor;
        }
        existente.piorFaixa = piorFaixaEntre([existente.piorFaixa, faixa]);
      } else {
        agrupado.set(clienteInfo.id, {
          cliente: clienteInfo,
          faturas: [f],
          valorVencido: dias > 0 ? f.valor : 0,
          valorAVencer7Dias: dias > 0 ? 0 : f.valor,
          diasAtrasoMaximo: dias > 0 ? dias : 0,
          piorFaixa: faixa,
        });
      }
    }

    return Array.from(agrupado.values()).sort((a, b) => {
      // Maior valor vencido primeiro; em empate, mais dias de atraso.
      if (b.valorVencido !== a.valorVencido)
        return b.valorVencido - a.valorVencido;
      return b.diasAtrasoMaximo - a.diasAtrasoMaximo;
    });
  },
};
