import {
  MetodoPagamento,
  StatusFatura,
  type DadosBoleto,
  type DadosPix,
  type Fatura,
  type ISODateString,
  type UUID,
  type ValorEmCentavos,
} from '@/types';
import {
  getConfiguracoes,
  useConfiguracoesStore,
  type ConfiguracoesCobranca,
} from '@/features/configuracoes/store/configuracoes.store';

const reaisToCentavos = (r: number): number => Math.round(r * 100);

const NOW_ISO = '2026-05-05T12:00:00Z';

// ---------------------------------------------------------------------------
// Geração mockada de dados Febraban / PIX (consumindo configuração ativa)
// ---------------------------------------------------------------------------

function gerarSequencia(seed: number, tamanho: number): string {
  let valor = '';
  let s = seed;
  while (valor.length < tamanho) {
    s = (s * 9301 + 49297) % 233280;
    valor += Math.floor((s / 233280) * 10).toString();
  }
  return valor.slice(0, tamanho);
}

function consumirNossoNumero(): string {
  // Quando rodamos a partir do seed inicial não há `set` válido ainda no store;
  // lemos via getState e atualizamos para refletir corretamente.
  const numero = useConfiguracoesStore.getState().consumirNossoNumero();
  return String(numero).padStart(10, '0');
}

function gerarBoletoMock(
  valor: ValorEmCentavos,
  vencimento: ISODateString,
  config: ConfiguracoesCobranca,
  nossoNumero: string,
): DadosBoleto {
  const codigoBanco = config.banco.codigoBanco || '341';
  const seedExtra =
    valor + new Date(vencimento).getTime() + Number(nossoNumero || '0');
  // 44 dígitos: prefixa com o código do banco real (3 dígitos) + sequência mock.
  const codigoBarras = (codigoBanco + gerarSequencia(seedExtra, 41)).slice(0, 44);
  // Linha digitável agrupada padrão Febraban (5.5.5.5.6.1.14)
  const linhaDigitavel = [
    `${codigoBarras.slice(0, 5)}.${codigoBarras.slice(5, 10)}`,
    `${codigoBarras.slice(10, 15)}.${codigoBarras.slice(15, 21)}`,
    `${codigoBarras.slice(21, 26)}.${codigoBarras.slice(26, 32)}`,
    codigoBarras.slice(32, 33),
    codigoBarras.slice(33, 47),
  ].join(' ');
  return {
    linhaDigitavel,
    codigoBarras,
    nossoNumero,
  };
}

function gerarPixMock(
  valor: ValorEmCentavos,
  config: ConfiguracoesCobranca,
): DadosPix {
  const txid = `DF${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
  const valorStr = (valor / 100).toFixed(2);
  const chave =
    config.pix.chave || config.beneficiario.cnpj || '12345678000199';
  const nomeBeneficiario = (config.beneficiario.razaoSocial || 'BENEFICIARIO')
    .toUpperCase()
    .slice(0, 25);
  const cidade = (config.beneficiario.endereco.cidade || 'SAO PAULO')
    .toUpperCase()
    .slice(0, 15);

  // Payload BR Code simplificado — suficiente para gerar QR visualmente coerente.
  const copiaECola =
    `00020126${(chave.length + 22).toString().padStart(2, '0')}` +
    `0014BR.GOV.BCB.PIX01${chave.length.toString().padStart(2, '0')}${chave}` +
    `52040000530398654${valorStr.length.toString().padStart(2, '0')}${valorStr}` +
    `5802BR59${nomeBeneficiario.length.toString().padStart(2, '0')}${nomeBeneficiario}` +
    `60${cidade.length.toString().padStart(2, '0')}${cidade}` +
    `62${(txid.length + 4).toString().padStart(2, '0')}05${txid.length
      .toString()
      .padStart(2, '0')}${txid}` +
    `6304${gerarSequencia(valor, 4).toUpperCase()}`;

  return {
    copiaECola,
    qrCode: txid, // o componente QrCodeMock renderiza visual a partir desse seed
    txid,
  };
}

// ---------------------------------------------------------------------------
// Seed inicial (boleto + PIX em todas as faturas)
// ---------------------------------------------------------------------------

let proximoNumero = 1027;
function novoNumeroFatura(): string {
  return `FAT-2026-${String(proximoNumero++).padStart(4, '0')}`;
}

interface SeedConfig {
  id: string;
  pedidoId: string;
  cliente: NonNullable<Fatura['cliente']>;
  valor: ValorEmCentavos;
  status: StatusFatura;
  emissao: ISODateString;
  vencimento: ISODateString;
  pagamento?: { metodo: MetodoPagamento; data: ISODateString };
  observacoes?: string;
}

function montarFaturaSeed(s: SeedConfig): Fatura {
  const config = getConfiguracoes();
  const nossoNumero = consumirNossoNumero();
  return {
    id: s.id,
    numero: novoNumeroFatura(),
    pedidoId: s.pedidoId,
    clienteId: s.cliente.id,
    cliente: s.cliente,
    valor: s.valor,
    valorPago: s.pagamento ? s.valor : undefined,
    status: s.status,
    dataEmissao: s.emissao,
    dataVencimento: s.vencimento,
    dataPagamento: s.pagamento?.data,
    pagamento: s.pagamento ? { metodo: s.pagamento.metodo } : undefined,
    boleto: gerarBoletoMock(s.valor, s.vencimento, config, nossoNumero),
    pix: gerarPixMock(s.valor, config),
    observacoes: s.observacoes,
    criadoEm: s.emissao,
    atualizadoEm: s.pagamento?.data ?? s.emissao,
  };
}

function criarSeed(): Fatura[] {
  const cliente1 = {
    id: '11111111-1111-1111-1111-111111111111',
    cnpj: '11444777000161',
    razaoSocial: 'Mercado Central LTDA',
  };
  const cliente2 = {
    id: '22222222-2222-2222-2222-222222222222',
    cnpj: '34028316000103',
    razaoSocial: 'Padaria Sol Nascente ME',
  };
  const cliente3 = {
    id: '33333333-3333-3333-3333-333333333333',
    cnpj: '60746948000112',
    razaoSocial: 'Restaurante Sabor Caseiro EIRELI',
  };
  const cliente4 = {
    id: '44444444-4444-4444-4444-444444444444',
    cnpj: '45283163000158',
    razaoSocial: 'Mercearia do João LTDA',
  };
  const cliente5 = {
    id: '55555555-5555-5555-5555-555555555555',
    cnpj: '07526557000100',
    razaoSocial: 'Empório das Bebidas LTDA',
  };

  return [
    montarFaturaSeed({
      id: 'fat-001',
      pedidoId: 'ped-0001',
      cliente: cliente1,
      valor: reaisToCentavos(2_880),
      status: StatusFatura.PENDENTE,
      emissao: '2026-04-28T12:00:00Z',
      vencimento: '2026-05-12T03:00:00Z',
    }),
    montarFaturaSeed({
      id: 'fat-002',
      pedidoId: 'ped-0002',
      cliente: cliente2,
      valor: reaisToCentavos(825),
      status: StatusFatura.PENDENTE,
      emissao: '2026-04-30T09:00:00Z',
      vencimento: '2026-05-08T03:00:00Z',
    }),
    montarFaturaSeed({
      id: 'fat-003',
      pedidoId: 'ped-0001',
      cliente: cliente1,
      valor: reaisToCentavos(1_950),
      status: StatusFatura.PAGO,
      emissao: '2026-04-15T08:00:00Z',
      vencimento: '2026-04-29T03:00:00Z',
      pagamento: {
        metodo: MetodoPagamento.BOLETO,
        data: '2026-04-28T14:22:00Z',
      },
    }),
    montarFaturaSeed({
      id: 'fat-004',
      pedidoId: 'ped-0003',
      cliente: cliente3,
      valor: reaisToCentavos(4_280.5),
      status: StatusFatura.PAGO,
      emissao: '2026-04-25T11:00:00Z',
      vencimento: '2026-05-04T03:00:00Z',
      pagamento: {
        metodo: MetodoPagamento.PIX,
        data: '2026-05-04T14:22:00Z',
      },
    }),
    montarFaturaSeed({
      id: 'fat-005',
      pedidoId: 'ped-0004',
      cliente: cliente5,
      valor: reaisToCentavos(7_120.9),
      status: StatusFatura.PENDENTE,
      emissao: '2026-05-03T10:00:00Z',
      vencimento: '2026-05-15T03:00:00Z',
    }),
    montarFaturaSeed({
      id: 'fat-006',
      pedidoId: 'ped-0001',
      cliente: cliente4,
      valor: reaisToCentavos(845),
      status: StatusFatura.VENCIDO,
      emissao: '2026-04-01T08:00:00Z',
      vencimento: '2026-04-15T03:00:00Z',
      observacoes: 'Cliente bloqueado por inadimplência',
    }),
  ];
}

let banco: Fatura[] = criarSeed();

const SIMULATED_LATENCY_MS = 350;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

// ---------------------------------------------------------------------------
// Filtros / payloads
// ---------------------------------------------------------------------------

export type StatusFiltro = StatusFatura | 'TODOS';

export interface FiltrosFaturas {
  busca?: string;
  status?: StatusFiltro;
  /** Restringe a listagem ao cliente informado (usado no portal /cliente). */
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
  metodoPago: MetodoPagamento;
  observacoes?: string;
}

export interface PagamentoCartaoPayload {
  /** Número do cartão (apenas dígitos). */
  numero: string;
  /** Bandeira detectada (Visa, Mastercard, Elo, Amex). */
  bandeira: string;
  /** Quantidade de parcelas escolhida pelo cliente. */
  parcelas: number;
}

// ---------------------------------------------------------------------------
// Aplicação automática de status (recalcula VENCIDO ao listar)
// ---------------------------------------------------------------------------

function aplicarStatusVencido(f: Fatura): Fatura {
  if (f.status !== StatusFatura.PENDENTE) return f;
  if (new Date(f.dataVencimento).getTime() < new Date(NOW_ISO).getTime()) {
    return { ...f, status: StatusFatura.VENCIDO };
  }
  return f;
}

// ---------------------------------------------------------------------------
// Service público
// ---------------------------------------------------------------------------

export const cobrancasService = {
  async listar(filtros: FiltrosFaturas = {}): Promise<Fatura[]> {
    await delay();
    const buscaNorm = (filtros.busca ?? '').trim().toLowerCase();
    return banco
      .map(aplicarStatusVencido)
      .filter((f) => {
        if (filtros.clienteId && f.clienteId !== filtros.clienteId) {
          return false;
        }
        if (
          filtros.status &&
          filtros.status !== 'TODOS' &&
          f.status !== filtros.status
        ) {
          return false;
        }
        if (!buscaNorm) return true;
        return (
          f.numero.toLowerCase().includes(buscaNorm) ||
          (f.cliente?.razaoSocial.toLowerCase().includes(buscaNorm) ?? false) ||
          (f.cliente?.cnpj.includes(buscaNorm.replace(/\D/g, '')) ?? false)
        );
      })
      .sort((a, b) =>
        a.dataVencimento < b.dataVencimento
          ? -1
          : a.dataVencimento > b.dataVencimento
            ? 1
            : 0,
      );
  },

  async obter(id: UUID): Promise<Fatura | undefined> {
    await delay();
    const f = banco.find((x) => x.id === id);
    return f ? aplicarStatusVencido(f) : undefined;
  },

  async criar(payload: NovaCobrancaPayload): Promise<Fatura> {
    await delay();
    const config = getConfiguracoes();
    if (!config.banco.agencia || !config.banco.conta || !config.pix.chave) {
      throw new Error(
        'Configurações de cobrança incompletas. Preencha banco e chave PIX em /admin/configuracoes.',
      );
    }
    const id = `fat-${crypto.randomUUID().slice(0, 8)}`;
    const numero = novoNumeroFatura();
    const nossoNumero = consumirNossoNumero();

    const nova: Fatura = {
      id,
      numero,
      pedidoId: payload.pedidoId,
      clienteId: payload.clienteId,
      valor: payload.valor,
      status: StatusFatura.PENDENTE,
      dataEmissao: NOW_ISO,
      dataVencimento: payload.dataVencimento,
      observacoes: payload.observacoes,
      criadoEm: NOW_ISO,
      atualizadoEm: NOW_ISO,
      boleto: gerarBoletoMock(payload.valor, payload.dataVencimento, config, nossoNumero),
      pix: gerarPixMock(payload.valor, config),
    };

    banco = [...banco, nova];
    return nova;
  },

  async baixarManual(id: UUID, payload: BaixaManualPayload): Promise<Fatura> {
    await delay();
    const idx = banco.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Fatura não encontrada.');
    const atual = banco[idx];
    if (atual.status === StatusFatura.PAGO) {
      throw new Error('Esta fatura já está marcada como paga.');
    }
    if (atual.status === StatusFatura.CANCELADO) {
      throw new Error('Não é possível baixar uma fatura cancelada.');
    }
    const atualizada: Fatura = {
      ...atual,
      status: StatusFatura.PAGO,
      valorPago: atual.valor,
      dataPagamento: payload.dataPagamento,
      pagamento: { metodo: payload.metodoPago },
      observacoes: payload.observacoes ?? atual.observacoes,
      atualizadoEm: NOW_ISO,
    };
    banco = banco.map((f) => (f.id === id ? atualizada : f));
    return atualizada;
  },

  async pagarComCartao(
    id: UUID,
    payload: PagamentoCartaoPayload,
  ): Promise<Fatura> {
    await delay();
    const idx = banco.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Fatura não encontrada.');
    const atual = banco[idx];
    if (atual.status === StatusFatura.PAGO) {
      throw new Error('Esta fatura já está marcada como paga.');
    }
    if (atual.status === StatusFatura.CANCELADO) {
      throw new Error('Não é possível pagar uma fatura cancelada.');
    }
    const ultimosDigitos = payload.numero.slice(-4);
    const authorizationId = `AUTH-${Date.now().toString(36).toUpperCase()}`;
    const atualizada: Fatura = {
      ...atual,
      status: StatusFatura.PAGO,
      valorPago: atual.valor,
      dataPagamento: NOW_ISO,
      pagamento: {
        metodo: MetodoPagamento.CARTAO_CREDITO,
        cartao: {
          bandeira: payload.bandeira,
          ultimosDigitos,
          parcelas: payload.parcelas,
          authorizationId,
        },
      },
      atualizadoEm: NOW_ISO,
    };
    banco = banco.map((f) => (f.id === id ? atualizada : f));
    return atualizada;
  },

  async cancelarFatura(id: UUID, motivo: string): Promise<Fatura> {
    await delay();
    const idx = banco.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Fatura não encontrada.');
    const atual = banco[idx];
    if (atual.status === StatusFatura.PAGO) {
      throw new Error('Não é possível cancelar uma fatura já paga.');
    }
    if (atual.status === StatusFatura.CANCELADO) {
      throw new Error('Esta fatura já está cancelada.');
    }
    const atualizada: Fatura = {
      ...atual,
      status: StatusFatura.CANCELADO,
      atualizadoEm: NOW_ISO,
      motivoCancelamento: motivo,
    };
    banco = banco.map((f) => (f.id === id ? atualizada : f));
    return atualizada;
  },
};
