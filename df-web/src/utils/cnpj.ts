/**
 * Utilidades para CNPJ:
 *  - máscara automática durante a digitação
 *  - validação dos dois dígitos verificadores via módulo 11
 */

const PESOS_CNPJ_PRIMEIRO = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_SEGUNDO = [6, ...PESOS_CNPJ_PRIMEIRO];

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Aplica máscara `00.000.000/0000-00` em uma string parcial ou completa. */
export function maskCNPJ(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function calcularDV(digitos: string, pesos: number[]): number {
  const soma = pesos.reduce(
    (acc, peso, i) => acc + Number(digitos[i]) * peso,
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Validação canônica de CNPJ (módulo 11). Aceita string com ou sem máscara. */
export function isCNPJValido(valor: string): boolean {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const dv1 = calcularDV(cnpj.slice(0, 12), PESOS_CNPJ_PRIMEIRO);
  if (dv1 !== Number(cnpj[12])) return false;

  const dv2 = calcularDV(cnpj.slice(0, 13), PESOS_CNPJ_SEGUNDO);
  return dv2 === Number(cnpj[13]);
}

export function maskTelefone(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCEP(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
