export function apenasDigitosCpf(input: string): string {
	return input.replace(/\D/g, '')
}

export function validarCpf(input: string): boolean {
	const cpf = apenasDigitosCpf(input)
	if (cpf.length !== 11) return false
	if (/^(\d)\1+$/.test(cpf)) return false

	const calc = (base: string, pesoInicial: number) => {
		let soma = 0
		for (let i = 0; i < base.length; i++) {
			soma += Number(base[i]) * (pesoInicial - i)
		}
		const resto = (soma * 10) % 11
		return resto === 10 ? 0 : resto
	}

	const d1 = calc(cpf.slice(0, 9), 10)
	if (d1 !== Number(cpf[9])) return false
	const d2 = calc(cpf.slice(0, 10), 11)
	return d2 === Number(cpf[10])
}
