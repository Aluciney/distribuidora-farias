import type { Cliente, ConfiguracoesCobranca, Fatura } from '@prisma/client'
import bwipjs from 'bwip-js'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

interface GerarPdfInput {
	fatura: Fatura
	cliente: Cliente
	config: ConfiguracoesCobranca
}

const COR_TITULO = '#0f172a'
const COR_TEXTO = '#1e293b'
const COR_LABEL = '#64748b'
const COR_LINHA = '#e2e8f0'

export async function gerarBoletoPdf(input: GerarPdfInput): Promise<Buffer> {
	const { fatura, cliente, config } = input

	const qrPng = await QRCode.toBuffer(fatura.pixCopiaECola, {
		type: 'png',
		width: 280,
		margin: 4,
		errorCorrectionLevel: 'M',
		color: { dark: '#000000', light: '#FFFFFF' },
	})

	// Código de barras Febraban — 44 dígitos em "Interleaved 2 of 5" (ITF), o
	// formato lido pelos leitores de boleto bancário. O PNG é embutido no PDF.
	const codigoBarrasPng = await gerarCodigoBarrasFebraban(fatura.boletoCodigoBarras)

	return new Promise<Buffer>((resolve, reject) => {
		const doc = new PDFDocument({ size: 'A4', margin: 50 })
		const chunks: Buffer[] = []
		doc.on('data', (c) => chunks.push(c))
		doc.on('end', () => resolve(Buffer.concat(chunks)))
		doc.on('error', reject)

		doc
			.fillColor(COR_TITULO)
			.fontSize(18)
			.text(config.beneficiarioRazaoSocial || 'Cobrança', { continued: false })

		doc.fillColor(COR_LABEL).fontSize(9).text('Fatura de cobrança').moveDown(0.5)

		doc
			.fillColor(COR_TITULO)
			.fontSize(14)
			.text(`Fatura ${fatura.numero}`, { align: 'left' })

		desenharLinha(doc)

		bloco(doc, 'Sacado / Cliente', cliente.razaoSocial)
		bloco(doc, 'CNPJ', formatarCnpj(cliente.cnpj))

		desenharLinha(doc)

		bloco(doc, 'Emissão', formatarData(fatura.dataEmissao))
		bloco(doc, 'Vencimento', formatarData(fatura.dataVencimento))
		bloco(doc, 'Valor', formatarValor(fatura.valor))
		bloco(doc, 'Nosso número', fatura.boletoNossoNumero)

		desenharLinha(doc)

		doc
			.fillColor(COR_LABEL)
			.fontSize(9)
			.text('LINHA DIGITÁVEL', { continued: false })
		doc.fillColor(COR_TEXTO).font('Courier').fontSize(11).text(fatura.boletoLinhaDigitavel)
		doc.font('Helvetica')
		doc.moveDown(0.6)

		// Barcode renderizado como imagem ocupando a largura útil da página.
		// Altura fixa em 55pt — leitores ópticos exigem barras altas o
		// suficiente para tolerar leitura inclinada.
		const larguraUtil = doc.page.width - 100
		doc.image(codigoBarrasPng, 50, doc.y, { width: larguraUtil, height: 55 })
		doc.y += 60
		doc.x = 50
		doc.fillColor(COR_LABEL).fontSize(8).text(fatura.boletoCodigoBarras, { align: 'center' })

		desenharLinha(doc)

		const yAntesPix = doc.y
		doc.image(qrPng, 50, yAntesPix, { width: 140 })
		const xTexto = 210
		doc
			.fillColor(COR_LABEL)
			.fontSize(9)
			.text('PIX — COPIA E COLA', xTexto, yAntesPix)
		doc
			.fillColor(COR_TEXTO)
			.font('Courier')
			.fontSize(8)
			.text(fatura.pixCopiaECola, xTexto, yAntesPix + 14, { width: 330 })
		doc.font('Helvetica')

		doc.y = Math.max(doc.y, yAntesPix + 150)
		doc.x = 50

		if (config.encargosMensagemPadrao) {
			desenharLinha(doc)
			bloco(doc, 'Instruções', config.encargosMensagemPadrao)
		}

		if (fatura.observacoes) {
			desenharLinha(doc)
			bloco(doc, 'Observações', fatura.observacoes)
		}

		doc.end()
	})
}

function bloco(doc: PDFKit.PDFDocument, label: string, valor: string) {
	doc.fillColor(COR_LABEL).fontSize(8).text(label.toUpperCase())
	doc.fillColor(COR_TEXTO).fontSize(11).text(valor)
	doc.moveDown(0.4)
}

function desenharLinha(doc: PDFKit.PDFDocument) {
	doc.moveDown(0.5)
	const y = doc.y
	doc.strokeColor(COR_LINHA).lineWidth(1).moveTo(50, y).lineTo(545, y).stroke()
	doc.moveDown(0.6)
}

function formatarCnpj(cnpj: string): string {
	const d = cnpj.replace(/\D/g, '').padStart(14, '0')
	return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

function formatarData(d: Date): string {
	const dia = String(d.getUTCDate()).padStart(2, '0')
	const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
	const ano = d.getUTCFullYear()
	return `${dia}/${mes}/${ano}`
}

function formatarValor(centavos: number): string {
	const reais = (centavos / 100).toFixed(2).replace('.', ',')
	const partes = reais.split(',')
	const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
	return `R$ ${inteiro},${partes[1]}`
}

async function gerarCodigoBarrasFebraban(codigo: string): Promise<Buffer> {
	const apenasDigitos = codigo.replace(/\D/g, '')
	// ITF exige número par de dígitos. Febraban (44) já é par, mas blindamos.
	const texto = apenasDigitos.length % 2 === 0 ? apenasDigitos : `0${apenasDigitos}`

	return bwipjs.toBuffer({
		bcid: 'interleaved2of5',
		text: texto,
		scale: 2,
		height: 14,
		includetext: false,
		paddingwidth: 0,
		paddingheight: 0,
		backgroundcolor: 'ffffff',
	})
}
