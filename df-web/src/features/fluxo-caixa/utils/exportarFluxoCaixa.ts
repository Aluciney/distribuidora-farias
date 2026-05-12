import type { FluxoCaixaMensal } from '@/features/fluxo-caixa/mocks/fluxoCaixa.mock';
import { MetodoPagamento, type ValorEmCentavos } from '@/types';

const METODO_LABEL: Record<string, string> = {
  [MetodoPagamento.BOLETO]: 'Boleto',
  [MetodoPagamento.PIX]: 'PIX',
  [MetodoPagamento.CARTAO_CREDITO]: 'Cartao de Credito',
  [MetodoPagamento.DINHEIRO]: 'Dinheiro',
};

const STATUS_LABEL: Record<string, string> = {
  PAGO: 'Pago',
  PENDENTE: 'Pendente',
  VENCIDO: 'Vencido',
};

function reaisPtBr(centavos: ValorEmCentavos): string {
  return (centavos / 100)
    .toFixed(2)
    .replace('.', ',');
}

function dataPtBr(iso: string): string {
  const apenasData = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = new Date(apenasData ? `${iso}T00:00:00Z` : iso);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const ano = d.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

function escaparCampo(valor: string | number): string {
  const s = String(valor);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function linha(...campos: (string | number)[]): string {
  return campos.map(escaparCampo).join(';');
}

function montarCsv(data: FluxoCaixaMensal, mes: string): string {
  const linhas: string[] = [];

  linhas.push(linha('Fluxo de Caixa'));
  linhas.push(linha('Mes de referencia', mes));
  linhas.push('');

  linhas.push(linha('Resumo do mes'));
  linhas.push(linha('Indicador', 'Valor (R$)'));
  linhas.push(linha('Total recebido', reaisPtBr(data.totalRecebido)));
  linhas.push(linha('Total pendente', reaisPtBr(data.totalPendente)));
  linhas.push(linha('Total vencido', reaisPtBr(data.totalVencido)));
  linhas.push(linha('Ticket medio', reaisPtBr(data.ticketMedio)));
  linhas.push(linha('Total de faturas', data.totalFaturas));
  linhas.push(
    linha(
      'Variacao vs. mes anterior (%)',
      data.variacaoMesAnterior.toFixed(2).replace('.', ','),
    ),
  );
  linhas.push('');

  linhas.push(linha('Movimentacoes diarias'));
  linhas.push(linha('Data', 'Recebido (R$)', 'Previsto (R$)'));
  for (const m of data.movimentacoesDiarias) {
    linhas.push(
      linha(dataPtBr(m.data), reaisPtBr(m.recebido), reaisPtBr(m.previsto)),
    );
  }
  linhas.push('');

  linhas.push(linha('Resumo por metodo de pagamento'));
  linhas.push(linha('Metodo', 'Recebido (R$)', 'Pendente (R$)'));
  for (const r of data.resumoPorMetodo) {
    linhas.push(
      linha(
        METODO_LABEL[r.metodo] ?? r.metodo,
        reaisPtBr(r.recebido),
        reaisPtBr(r.pendente),
      ),
    );
  }
  linhas.push('');

  linhas.push(linha('Ultimas movimentacoes'));
  linhas.push(linha('Data', 'Cliente', 'Metodo', 'Status', 'Valor (R$)'));
  for (const u of data.ultimasMovimentacoes) {
    linhas.push(
      linha(
        dataPtBr(u.data),
        u.cliente,
        METODO_LABEL[u.metodo] ?? u.metodo,
        STATUS_LABEL[u.status] ?? u.status,
        reaisPtBr(u.valor),
      ),
    );
  }

  return linhas.join('\r\n');
}

export function exportarFluxoCaixaCsv(
  data: FluxoCaixaMensal,
  mes: string,
): void {
  const csv = montarCsv(data, mes);
  // BOM UTF-8 para que o Excel reconheca os acentos corretamente.
  const blob = new Blob(['﻿', csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fluxo-caixa-${mes}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
