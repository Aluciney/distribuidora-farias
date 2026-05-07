/** Formata centavos como R$ pt-BR. */
export function formatCurrency(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Formata data ISO como dd/MM/yyyy. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(
    d.getUTCMonth() + 1,
  ).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

/** dd/MM/yyyy HH:mm */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aa = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${aa} ${hh}:${mi}`;
}

export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(
    12,
    14,
  )}`;
}

export function apenasDigitos(v: string): string {
  return v.replace(/\D/g, '');
}

export function maskCNPJ(v: string): string {
  const d = apenasDigitos(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskTelefone(v: string): string {
  const d = apenasDigitos(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskNumeroCartao(v: string): string {
  const d = apenasDigitos(v).slice(0, 19);
  return d.replace(/(.{4})/g, '$1 ').trim();
}

export function maskValidade(v: string): string {
  const d = apenasDigitos(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

const BANDEIRAS: { nome: string; regex: RegExp }[] = [
  { nome: 'VISA', regex: /^4/ },
  { nome: 'MASTERCARD', regex: /^(5[1-5]|2[2-7])/ },
  { nome: 'AMEX', regex: /^3[47]/ },
  { nome: 'ELO', regex: /^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/ },
  { nome: 'HIPERCARD', regex: /^(606282|3841)/ },
];

export function detectarBandeira(numero: string): string | null {
  const d = apenasDigitos(numero);
  if (!d) return null;
  for (const b of BANDEIRAS) if (b.regex.test(d)) return b.nome;
  return null;
}
