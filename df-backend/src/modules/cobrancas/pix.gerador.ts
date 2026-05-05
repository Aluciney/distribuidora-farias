import { randomUUID } from 'node:crypto'
import type { ConfiguracoesCobranca } from '@prisma/client'

export interface IPixGerador {
	gerar(input: {
		valor: number
		config: ConfiguracoesCobranca
	}): Promise<{
		copiaECola: string
		qrCode: string
		txid: string
		expiraEm?: Date
	}>
}

/** Implementação mock — gera string BR Code minimamente plausível e txid único. */
export class PixMockGerador implements IPixGerador {
	async gerar({ valor, config }: { valor: number; config: ConfiguracoesCobranca }) {
		const txid = randomUUID().replace(/-/g, '').slice(0, 25).toUpperCase()
		const valorStr = (valor / 100).toFixed(2)
		const beneficiario = (config.beneficiarioRazaoSocial || 'DF DISTRIBUIDORA').slice(0, 25).toUpperCase()
		const cidade = (config.beneficiarioCidade || 'BELEM').slice(0, 15).toUpperCase()

		const payload = [
			'00020126',
			`58${('BR' as string).length.toString().padStart(2, '0')}BR`,
			`5303986`,
			`54${valorStr.length.toString().padStart(2, '0')}${valorStr}`,
			`5802BR`,
			`59${beneficiario.length.toString().padStart(2, '0')}${beneficiario}`,
			`60${cidade.length.toString().padStart(2, '0')}${cidade}`,
			`62${(4 + txid.length).toString().padStart(2, '0')}05${txid.length.toString().padStart(2, '0')}${txid}`,
			'6304',
		].join('')
		const copiaECola = `${payload}${this.crc16(payload)}`

		const qrCode = `data:image/svg+xml;utf8,${encodeURIComponent(
			`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='white'/><text x='50' y='50' font-size='6' text-anchor='middle' fill='black'>PIX</text></svg>`,
		)}`

		return {
			copiaECola,
			qrCode,
			txid,
			expiraEm: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		}
	}

	private crc16(payload: string): string {
		let crc = 0xffff
		for (let i = 0; i < payload.length; i++) {
			crc ^= payload.charCodeAt(i) << 8
			for (let j = 0; j < 8; j++) {
				crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
			}
		}
		return crc.toString(16).toUpperCase().padStart(4, '0')
	}
}
