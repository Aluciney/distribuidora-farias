import type { ConfiguracoesCobranca } from '@prisma/client'

export interface IBoletoGerador {
	gerar(input: {
		valor: number
		dataVencimento: Date
		nossoNumero: string
		config: ConfiguracoesCobranca
	}): Promise<{
		linhaDigitavel: string
		codigoBarras: string
		nossoNumero: string
		urlPdf?: string
	}>
}

/** Implementação mock determinística — espelha a lógica do front (`cobrancas.mock.ts`). */
export class BoletoMockGerador implements IBoletoGerador {
	async gerar(input: { valor: number; dataVencimento: Date; nossoNumero: string; config: ConfiguracoesCobranca }) {
		const { valor, dataVencimento, nossoNumero, config } = input
		const valorStr = String(valor).padStart(10, '0')
		const codigoBanco = config.bancoCodigo.padStart(3, '0')
		const moeda = '9'
		const fatorVenc = String(this.fatorDeVencimento(dataVencimento)).padStart(4, '0')
		const campoLivre = `${config.bancoAgencia}${config.bancoCarteira}${nossoNumero}${config.bancoConta}`.padEnd(25, '0').slice(0, 25)
		const semDv = `${codigoBanco}${moeda}${fatorVenc}${valorStr}${campoLivre}`
		const dv = this.dvCodigoBarras(semDv)
		const codigoBarras = `${codigoBanco}${moeda}${dv}${fatorVenc}${valorStr}${campoLivre}`

		const c1 = `${codigoBanco}${moeda}${campoLivre.slice(0, 5)}`
		const c2 = campoLivre.slice(5, 15)
		const c3 = campoLivre.slice(15, 25)
		const linhaDigitavel = `${c1.slice(0, 5)}.${c1.slice(5)} ${c2.slice(0, 5)}.${c2.slice(5)} ${c3.slice(0, 5)}.${c3.slice(5)} ${dv} ${fatorVenc}${valorStr}`

		return {
			linhaDigitavel,
			codigoBarras,
			nossoNumero,
		}
	}

	private fatorDeVencimento(data: Date): number {
		const base = Date.UTC(1997, 9, 7)
		const venc = Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
		return Math.floor((venc - base) / (1000 * 60 * 60 * 24))
	}

	private dvCodigoBarras(semDv: string): string {
		const pesos = [2, 3, 4, 5, 6, 7, 8, 9]
		let soma = 0
		let p = 0
		for (let i = semDv.length - 1; i >= 0; i--) {
			soma += Number(semDv[i]) * pesos[p]
			p = (p + 1) % pesos.length
		}
		const resto = soma % 11
		const dv = 11 - resto
		if (dv === 0 || dv === 10 || dv === 11) return '1'
		return String(dv)
	}
}
