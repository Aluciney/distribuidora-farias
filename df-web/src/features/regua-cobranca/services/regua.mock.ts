import {
  CanalNotificacao,
  GatilhoRegua,
  type RegraCobranca,
  type UUID,
} from '@/types';

const NOW = '2026-05-05T12:00:00Z';

const SEED: RegraCobranca[] = [
  {
    id: 'rg-001',
    nome: 'Lembrete prévio (3 dias antes)',
    descricao:
      'Envia email 3 dias antes do vencimento com linha digitável e PIX.',
    ativo: true,
    gatilho: GatilhoRegua.ANTES_VENCIMENTO,
    diasOffset: -3,
    acoes: [
      {
        canal: CanalNotificacao.EMAIL,
        assunto: 'Sua fatura {{numero}} vence em 3 dias',
        mensagem:
          'Olá {{cliente}}, sua fatura no valor de {{valor}} vence em {{vencimento}}. ' +
          'Linha digitável: {{linha}}. PIX Copia e Cola: {{pix}}.',
      },
    ],
    criadoEm: '2025-11-01T10:00:00Z',
    atualizadoEm: '2026-04-12T16:30:00Z',
  },
  {
    id: 'rg-002',
    nome: 'Aviso no dia do vencimento',
    descricao:
      'Email + WhatsApp para reforçar a data limite de pagamento.',
    ativo: true,
    gatilho: GatilhoRegua.DIA_VENCIMENTO,
    diasOffset: 0,
    acoes: [
      {
        canal: CanalNotificacao.EMAIL,
        assunto: 'Vence hoje: fatura {{numero}}',
        mensagem:
          'Bom dia, {{cliente}}. Sua fatura {{numero}} de {{valor}} vence hoje. ' +
          'Para evitar juros, efetue o pagamento até o fim do dia.',
      },
      {
        canal: CanalNotificacao.WHATSAPP,
        mensagem:
          'Olá {{cliente}}! Lembramos que sua fatura de {{valor}} vence hoje. ' +
          'Pague pelo PIX: {{pix}}',
      },
    ],
    criadoEm: '2025-11-01T10:00:00Z',
    atualizadoEm: '2026-03-22T09:00:00Z',
  },
  {
    id: 'rg-003',
    nome: '1º aviso de atraso (3 dias após)',
    descricao: 'Email + SMS quando atraso passa de 72h.',
    ativo: true,
    gatilho: GatilhoRegua.APOS_VENCIMENTO,
    diasOffset: 3,
    acoes: [
      {
        canal: CanalNotificacao.EMAIL,
        assunto: 'Atualize o pagamento da fatura {{numero}}',
        mensagem:
          'Olá {{cliente}}, identificamos que sua fatura {{numero}} de {{valor}} ' +
          'venceu em {{vencimento}} e ainda não foi quitada. Entre em contato.',
      },
      {
        canal: CanalNotificacao.SMS,
        mensagem:
          'Distribuidora Farias: fatura {{numero}} em atraso. Regularize hoje: {{pix}}',
      },
    ],
    criadoEm: '2025-11-01T10:00:00Z',
    atualizadoEm: '2026-04-30T17:30:00Z',
  },
  {
    id: 'rg-004',
    nome: 'Cobrança 15 dias',
    descricao: 'Aviso firme antes da negativação.',
    ativo: false,
    gatilho: GatilhoRegua.APOS_VENCIMENTO,
    diasOffset: 15,
    acoes: [
      {
        canal: CanalNotificacao.EMAIL,
        assunto: 'URGENTE: pendência fatura {{numero}}',
        mensagem:
          '{{cliente}}, sua fatura {{numero}} ({{valor}}) está com 15 dias de atraso. ' +
          'Caso não seja regularizada, será encaminhada à cobrança externa.',
      },
    ],
    criadoEm: '2025-11-01T10:00:00Z',
    atualizadoEm: '2026-02-10T11:00:00Z',
  },
];

let banco: RegraCobranca[] = [...SEED];

const SIMULATED_LATENCY_MS = 300;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

export type DadosRegra = Omit<RegraCobranca, 'id' | 'criadoEm' | 'atualizadoEm'>;

export const reguaService = {
  async listar(): Promise<RegraCobranca[]> {
    await delay();
    // Ordena no eixo de tempo: antes (offset negativo) → dia → depois.
    return [...banco].sort((a, b) => a.diasOffset - b.diasOffset);
  },

  async obter(id: UUID): Promise<RegraCobranca | undefined> {
    await delay();
    return banco.find((r) => r.id === id);
  },

  async criar(dados: DadosRegra): Promise<RegraCobranca> {
    await delay();
    const novo: RegraCobranca = {
      ...dados,
      id: `rg-${crypto.randomUUID().slice(0, 8)}`,
      criadoEm: NOW,
      atualizadoEm: NOW,
    };
    banco = [...banco, novo];
    return novo;
  },

  async atualizar(id: UUID, dados: DadosRegra): Promise<RegraCobranca> {
    await delay();
    const idx = banco.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Regra não encontrada.');
    const atualizado: RegraCobranca = {
      ...banco[idx],
      ...dados,
      id,
      atualizadoEm: NOW,
    };
    banco = banco.map((r) => (r.id === id ? atualizado : r));
    return atualizado;
  },

  async alternarAtivo(id: UUID): Promise<RegraCobranca> {
    await delay();
    const atual = banco.find((r) => r.id === id);
    if (!atual) throw new Error('Regra não encontrada.');
    const atualizado: RegraCobranca = {
      ...atual,
      ativo: !atual.ativo,
      atualizadoEm: NOW,
    };
    banco = banco.map((r) => (r.id === id ? atualizado : r));
    return atualizado;
  },

  async excluir(id: UUID): Promise<void> {
    await delay();
    banco = banco.filter((r) => r.id !== id);
  },
};
