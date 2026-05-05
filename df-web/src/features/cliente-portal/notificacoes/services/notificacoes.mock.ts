import { cobrancasService } from '@/features/cobrancas/services/cobrancas.mock';
import {
  StatusFatura,
  type Notificacao,
  type UUID,
} from '@/types';

const NOW_ISO = '2026-05-05T12:00:00Z';
const NOW_MS = new Date(NOW_ISO).getTime();
const MS_DIA = 24 * 60 * 60 * 1000;

/**
 * Estado de leitura por cliente. As notificações em si são derivadas
 * dinamicamente das faturas — apenas o set de IDs lidos persiste em memória.
 */
const lidasPorCliente: Map<UUID, Set<string>> = new Map();

const SIMULATED_LATENCY_MS = 300;
const delay = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));

function diasAteHoje(iso: string): number {
  return Math.floor((NOW_MS - new Date(iso).getTime()) / MS_DIA);
}

function gerarTexto(dias: number, vencimento: string, valor: number) {
  const valorFmt = (valor / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  if (dias > 0) {
    return {
      titulo: `Fatura em atraso há ${dias} dia${dias === 1 ? '' : 's'}`,
      mensagem: `Sua fatura de ${valorFmt} venceu em ${new Date(
        vencimento,
      ).toLocaleDateString('pt-BR')} e ainda não foi quitada.`,
    };
  }
  if (dias === 0) {
    return {
      titulo: 'Sua fatura vence hoje',
      mensagem: `Sua fatura de ${valorFmt} vence hoje. Evite juros pagando até o fim do dia.`,
    };
  }
  const proximos = Math.abs(dias);
  return {
    titulo: `Fatura vence em ${proximos} dia${proximos === 1 ? '' : 's'}`,
    mensagem: `Sua fatura de ${valorFmt} vence em ${new Date(
      vencimento,
    ).toLocaleDateString('pt-BR')}.`,
  };
}

export const notificacoesService = {
  async listar(clienteId: UUID): Promise<Notificacao[]> {
    await delay();
    const faturas = await cobrancasService.listar({
      clienteId,
      status: 'TODOS',
    });
    const lidas = lidasPorCliente.get(clienteId) ?? new Set<string>();

    const notificacoes: Notificacao[] = [];
    for (const f of faturas) {
      if (f.status === StatusFatura.PAGO || f.status === StatusFatura.CANCELADO) {
        continue;
      }
      const dias = diasAteHoje(f.dataVencimento);
      // Inclui se está em atraso OU vence em até 7 dias.
      if (dias > 0 || (dias <= 0 && dias >= -7)) {
        const id = `notif-${f.id}-${dias}`;
        const { titulo, mensagem } = gerarTexto(dias, f.dataVencimento, f.valor);
        notificacoes.push({
          id,
          titulo,
          mensagem,
          naoLida: !lidas.has(id),
          faturaId: f.id,
          criadoEm:
            dias > 0
              ? new Date(NOW_MS - dias * MS_DIA).toISOString()
              : new Date(NOW_MS - 60 * 60 * 1000).toISOString(),
        });
      }
    }
    // Mais recentes (ou mais críticas) no topo.
    return notificacoes.sort(
      (a, b) =>
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );
  },

  async marcarComoLida(clienteId: UUID, id: string): Promise<void> {
    await delay();
    const set = lidasPorCliente.get(clienteId) ?? new Set<string>();
    set.add(id);
    lidasPorCliente.set(clienteId, set);
  },

  async marcarTodasComoLidas(clienteId: UUID): Promise<void> {
    await delay();
    const lista = await this.listar(clienteId);
    const set = lidasPorCliente.get(clienteId) ?? new Set<string>();
    for (const n of lista) set.add(n.id);
    lidasPorCliente.set(clienteId, set);
  },
};
