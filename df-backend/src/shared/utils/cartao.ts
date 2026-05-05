export function apenasDigitos(input: string): string {
	return input.replace(/\D/g, '')
}

/** Valida número do cartão via algoritmo de Luhn. */
export function validarLuhn(numero: string): boolean {
	const d = apenasDigitos(numero)
	if (d.length < 13 || d.length > 19) return false
	let soma = 0
	let alternar = false
	for (let i = d.length - 1; i >= 0; i--) {
		let n = Number(d[i])
		if (alternar) {
			n *= 2
			if (n > 9) n -= 9
		}
		soma += n
		alternar = !alternar
	}
	return soma % 10 === 0
}

export type BandeiraCartao = 'VISA' | 'MASTERCARD' | 'AMEX' | 'ELO' | 'HIPERCARD' | 'DINERS' | 'DESCONHECIDA'

/** Detecta bandeira do cartão pelo BIN (prefixo). */
export function detectarBandeira(numero: string): BandeiraCartao {
	const d = apenasDigitos(numero)
	if (/^4/.test(d)) return 'VISA'
	if (/^(5[1-5]|2[2-7])/.test(d)) return 'MASTERCARD'
	if (/^3[47]/.test(d)) return 'AMEX'
	if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(d)) return 'ELO'
	if (/^(606282|3841)/.test(d)) return 'HIPERCARD'
	if (/^3(0[0-5]|[68])/.test(d)) return 'DINERS'
	return 'DESCONHECIDA'
}

export function ultimosDigitos(numero: string, n = 4): string {
	const d = apenasDigitos(numero)
	return d.slice(-n)
}

/** Valida validade no formato MM/AA ou MM/AAAA — precisa estar no futuro. */
export function validadeFutura(validade: string): boolean {
	const m = validade.match(/^(\d{2})\/(\d{2}|\d{4})$/)
	if (!m) return false
	const mes = Number(m[1])
	let ano = Number(m[2])
	if (mes < 1 || mes > 12) return false
	if (m[2].length === 2) ano += 2000
	const fimDoMes = new Date(ano, mes, 0, 23, 59, 59)
	return fimDoMes.getTime() >= Date.now()
}
