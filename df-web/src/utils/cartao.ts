/**
 * Helpers para entrada e identificação de cartões de crédito.
 * Cobrem máscara visual, detecção de bandeira por prefixo e validação Luhn.
 */

export type Bandeira = 'Visa' | 'Mastercard' | 'Amex' | 'Elo' | 'Hipercard';

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function maskNumeroCartao(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 19);
  // Amex usa agrupamento 4-6-5; demais bandeiras 4-4-4-4 (até 19 dígitos).
  if (/^3[47]/.test(d)) {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)]
      .filter(Boolean)
      .join(' ');
  }
  return d.match(/.{1,4}/g)?.join(' ') ?? '';
}

export function maskValidade(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function detectarBandeira(numero: string): Bandeira | null {
  const d = apenasDigitos(numero);
  if (!d) return null;
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^(60|65|509|636368)/.test(d)) return 'Elo';
  if (/^(38|60[0-9]{2})/.test(d)) return 'Hipercard';
  return null;
}

/** Validação canônica de cartão pelo algoritmo de Luhn (módulo 10). */
export function isCartaoValido(numero: string): boolean {
  const d = apenasDigitos(numero);
  if (d.length < 13 || d.length > 19) return false;
  let soma = 0;
  let alterna = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (alterna) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    soma += n;
    alterna = !alterna;
  }
  return soma % 10 === 0;
}

/** Verifica se a validade `MM/AA` está no presente ou futuro. */
export function isValidadeFutura(validade: string): boolean {
  const m = validade.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const mes = Number(m[1]);
  const ano = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return false;
  // Considera o último dia do mês de validade.
  const ultimoDia = new Date(ano, mes, 0);
  return ultimoDia.getTime() >= Date.now();
}
