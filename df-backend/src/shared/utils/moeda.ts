/** Converte reais (string ou number, ex: 1234.56) para centavos (Int 123456). */
export function reaisParaCentavos(valor: number | string): number {
	if (typeof valor === 'number') return Math.round(valor * 100)
	const limpo = valor.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
	return Math.round(Number(limpo) * 100)
}

/** Converte centavos (Int) para reais (number). */
export function centavosParaReais(centavos: number): number {
	return centavos / 100
}

/** Formata centavos como BRL: 123456 → "R$ 1.234,56". */
export function formatarBrl(centavos: number): string {
	return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100)
}
