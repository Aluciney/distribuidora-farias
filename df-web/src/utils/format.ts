import type { ISODateString, ValorEmCentavos } from '@/types';

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DATE_PT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const DATETIME_PT = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const MONTH_PT = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

export function formatCurrency(centavos: ValorEmCentavos): string {
  return BRL.format(centavos / 100);
}

export function formatDate(iso: ISODateString): string {
  return DATE_PT.format(new Date(iso));
}

export function formatDateTime(iso: ISODateString): string {
  return DATETIME_PT.format(new Date(iso));
}

export function formatMonthYear(iso: ISODateString): string {
  const formatted = MONTH_PT.format(new Date(iso));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Aplica máscara de CNPJ: 00.000.000/0000-00. Aceita string com ou sem máscara. */
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '').padStart(14, '0').slice(-14);
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3.$4-$5',
  );
}
