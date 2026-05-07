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

/** Implementação mock — gera string BR Code (EMV/Bacen) válida para leitura nos apps de banco. */
export class PixMockGerador implements IPixGerador {
	async gerar({ valor, config }: { valor: number; config: ConfiguracoesCobranca }) {
		const txid = randomUUID().replace(/-/g, '').slice(0, 25).toUpperCase()
		const valorStr = (valor / 100).toFixed(2)
		const beneficiario = sanitizarTexto(config.beneficiarioRazaoSocial || 'DF DISTRIBUIDORA').slice(0, 25)
		const cidade = sanitizarTexto(config.beneficiarioCidade || 'BELEM').slice(0, 15)
		const chave = sanitizarChave(config.pixChave || 'pix@dfdistribuidora.com.br').slice(0, 77)

		// Tag 26 — Merchant Account Information do PIX
		// Sub-tag 00 = GUI fixo "BR.GOV.BCB.PIX"
		// Sub-tag 01 = chave PIX
		const subGui = tlv('00', 'BR.GOV.BCB.PIX')
		const subChave = tlv('01', chave)
		const mai = tlv('26', `${subGui}${subChave}`)

		// Tag 62 — Additional Data Field, sub-tag 05 = txid
		const additional = tlv('62', tlv('05', txid))

		const payloadSemCrc = [
			tlv('00', '01'), // Payload Format Indicator
			mai,
			tlv('52', '0000'), // MCC genérico
			tlv('53', '986'), // Moeda BRL
			tlv('54', valorStr),
			tlv('58', 'BR'),
			tlv('59', beneficiario),
			tlv('60', cidade),
			additional,
			'6304', // Tag CRC + length 04 — o CRC é calculado sobre a string até este "6304"
		].join('')
		const copiaECola = `${payloadSemCrc}${this.crc16(payloadSemCrc)}`

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

/** Codifica um campo TLV (Tag + Length 2-dígitos + Value) usado no BR Code. */
function tlv(tag: string, value: string): string {
	const len = value.length.toString().padStart(2, '0')
	return `${tag}${len}${value}`
}

/** Remove acentos / caracteres não-ASCII — exigência do BR Code. */
function sanitizarTexto(texto: string): string {
	return texto
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^\x20-\x7E]/g, '')
		.toUpperCase()
}

/** Sanitiza a chave PIX preservando o case (emails ficam em minúsculo). */
function sanitizarChave(chave: string): string {
	return chave
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^\x20-\x7E]/g, '')
		.trim()
}
