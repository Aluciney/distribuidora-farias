export function apenasDigitosCnpj(input: string): string {
	return input.replace(/\D/g, '')
}

export function formatarCnpj(cnpj: string): string {
	const d = apenasDigitosCnpj(cnpj).padStart(14, '0')
	return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

export function validarCnpj(input: string): boolean {
	const cnpj = apenasDigitosCnpj(input)
	if (cnpj.length !== 14) return false
	if (/^(\d)\1+$/.test(cnpj)) return false

	const calc = (base: string, pesos: number[]) => {
		const soma = base.split('').reduce((acc, ch, i) => acc + Number(ch) * pesos[i], 0)
		const resto = soma % 11
		return resto < 2 ? 0 : 11 - resto
	}

	const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
	const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

	const d1 = calc(cnpj.slice(0, 12), pesos1)
	if (d1 !== Number(cnpj[12])) return false
	const d2 = calc(cnpj.slice(0, 13), pesos2)
	return d2 === Number(cnpj[13])
}
