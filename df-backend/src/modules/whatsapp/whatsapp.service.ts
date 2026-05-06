import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	useMultiFileAuthState,
	type WASocket,
} from '@whiskeysockets/baileys'
import type { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { env } from '../../env'

export type StatusWhatsApp = 'desconectado' | 'aguardando_qr' | 'conectando' | 'conectado'

export interface InfoWhatsApp {
	status: StatusWhatsApp
	qrCodeDataUrl: string | null
	usuario: { id: string; nome?: string } | null
	ultimoErro: string | null
}

interface Logger {
	info(...args: unknown[]): void
	warn(...args: unknown[]): void
	error(...args: unknown[]): void
}

const consoleLogger: Logger = {
	info: () => undefined,
	warn: (...a) => console.warn('[whatsapp]', ...a),
	error: (...a) => console.error('[whatsapp]', ...a),
}

class WhatsAppService {
	private socket: WASocket | null = null
	private status: StatusWhatsApp = 'desconectado'
	private qrCodeDataUrl: string | null = null
	private usuario: InfoWhatsApp['usuario'] = null
	private ultimoErro: string | null = null
	private logger: Logger = consoleLogger
	private autoReconectar = true
	private iniciandoPromise: Promise<void> | null = null

	configurarLogger(logger: Logger) {
		this.logger = logger
	}

	getInfo(): InfoWhatsApp {
		return {
			status: this.status,
			qrCodeDataUrl: this.qrCodeDataUrl,
			usuario: this.usuario,
			ultimoErro: this.ultimoErro,
		}
	}

	estaConectado(): boolean {
		return this.status === 'conectado'
	}

	async iniciar(): Promise<void> {
		if (this.iniciandoPromise) return this.iniciandoPromise
		if (this.status === 'conectado' || this.status === 'conectando' || this.status === 'aguardando_qr') return

		this.autoReconectar = true
		this.iniciandoPromise = this.conectar()
		try {
			await this.iniciandoPromise
		} finally {
			this.iniciandoPromise = null
		}
	}

	async desconectar(): Promise<void> {
		this.autoReconectar = false
		if (this.socket) {
			try {
				await this.socket.logout()
			} catch {
				// ignora — pode estar offline
			}
			this.socket.end(undefined)
			this.socket = null
		}
		this.limparAuthDir()
		this.status = 'desconectado'
		this.qrCodeDataUrl = null
		this.usuario = null
		this.ultimoErro = null
	}

	private limparAuthDir(): void {
		const authDir = resolve(env.WHATSAPP_AUTH_DIR)
		try {
			rmSync(authDir, { recursive: true, force: true })
			this.logger.info(`Diretório de auth limpo: ${authDir}`)
		} catch (err) {
			this.logger.warn('Falha ao limpar diretório de auth', err)
		}
	}

	async enviarTexto(destinatario: string, mensagem: string): Promise<void> {
		if (!this.socket || !this.estaConectado()) {
			throw new Error('WhatsApp não está conectado.')
		}
		const jid = formatarJid(destinatario)
		await this.socket.sendMessage(jid, { text: mensagem })
	}

	private async conectar(): Promise<void> {
		this.status = 'conectando'
		this.ultimoErro = null

		const authDir = resolve(env.WHATSAPP_AUTH_DIR)
		mkdirSync(authDir, { recursive: true })

		const { state, saveCreds } = await useMultiFileAuthState(authDir)
		const { version } = await fetchLatestBaileysVersion()

		this.socket = makeWASocket({
			version,
			auth: state,
			printQRInTerminal: false,
			browser: [env.WHATSAPP_DEVICE_NAME, 'Chrome', '120.0.0'],
			markOnlineOnConnect: false,
		})

		this.socket.ev.on('creds.update', saveCreds)

		this.socket.ev.on('connection.update', async (update) => {
			const { connection, lastDisconnect, qr } = update

			if (qr) {
				try {
					this.qrCodeDataUrl = await QRCode.toDataURL(qr)
					this.status = 'aguardando_qr'
					this.logger.info('QR code do WhatsApp gerado — escaneie pelo painel admin')
				} catch (err) {
					this.logger.error('Falha ao gerar QR code', err)
				}
			}

			if (connection === 'open') {
				this.status = 'conectado'
				this.qrCodeDataUrl = null
				this.ultimoErro = null
				const me = this.socket?.user
				this.usuario = me ? { id: me.id, nome: me.name } : null
				this.logger.info(`WhatsApp conectado como ${me?.id ?? 'desconhecido'}`)
			}

			if (connection === 'close') {
				const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode
				const deslogado = code === DisconnectReason.loggedOut
				this.usuario = null
				this.qrCodeDataUrl = null

				// Encerra o socket antigo antes de qualquer reconexão para
				// evitar dois sockets vivos chamando saveCreds em paralelo.
				if (this.socket) {
					try {
						this.socket.end(undefined)
					} catch {
						// ignora
					}
					this.socket = null
				}

				if (deslogado) {
					this.limparAuthDir()
					this.ultimoErro = 'Sessão anterior expirou — gerando novo QR…'
					this.logger.warn(this.ultimoErro)
					if (this.autoReconectar) {
						setTimeout(() => {
							this.conectar().catch((err) => this.logger.error('Falha ao gerar novo QR', err))
						}, 1_000)
					} else {
						this.status = 'desconectado'
					}
					return
				}

				this.status = 'desconectado'
				this.ultimoErro = lastDisconnect?.error?.message ?? 'Conexão perdida'
				this.logger.warn(`WhatsApp desconectado (code=${code}): ${this.ultimoErro}`)

				if (this.autoReconectar) {
					setTimeout(() => {
						this.conectar().catch((err) => this.logger.error('Falha ao reconectar', err))
					}, 3_000)
				}
			}
		})
	}
}

function formatarJid(destinatario: string): string {
	if (destinatario.includes('@')) return destinatario
	const apenasDigitos = destinatario.replace(/\D/g, '')
	const comDdi = apenasDigitos.startsWith('55') ? apenasDigitos : `55${apenasDigitos}`
	return `${comDdi}@s.whatsapp.net`
}

export const whatsappService = new WhatsAppService()
