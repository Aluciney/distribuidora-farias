import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import makeWASocket, {
	DisconnectReason,
	fetchLatestBaileysVersion,
	useMultiFileAuthState,
	type WAMessageContent,
	type WAMessageKey,
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

/// Quantas mensagens enviadas guardamos em memória para responder retries.
/// O WhatsApp do destinatário pode pedir reenvio de uma mensagem cifrada
/// quando a sessão Signal ainda não está estabelecida; sem isso o usuário
/// vê "Aguardando mensagem…" pra sempre.
const LIMITE_CACHE_MENSAGENS = 200

class WhatsAppService {
	private socket: WASocket | null = null
	private status: StatusWhatsApp = 'desconectado'
	private qrCodeDataUrl: string | null = null
	private usuario: InfoWhatsApp['usuario'] = null
	private ultimoErro: string | null = null
	private logger: Logger = consoleLogger
	private autoReconectar = true
	private iniciandoPromise: Promise<void> | null = null
	private mensagensEnviadas = new Map<string, WAMessageContent>()
	/** Cache de telefones (com DDI) → JID confirmado pelo WhatsApp. Evita
	 *  consultar `onWhatsApp` toda vez que reenviamos para o mesmo cliente. */
	private jidCache = new Map<string, string>()

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
		// JIDs resolvidos são específicos da conta — limpa pra evitar usar
		// JID antigo se o admin escanear outra conta.
		this.jidCache.clear()
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
		const jid = await this.resolverJid(destinatario)
		await this.aquecerSessao(jid)
		const enviada = await this.socket.sendMessage(jid, { text: mensagem })
		this.cachearMensagem(enviada?.key, enviada?.message)
	}

	async enviarDocumento(
		destinatario: string,
		documento: { buffer: Buffer; nomeArquivo: string; mimetype: string },
		legenda?: string,
	): Promise<void> {
		if (!this.socket || !this.estaConectado()) {
			throw new Error('WhatsApp não está conectado.')
		}
		const jid = await this.resolverJid(destinatario)
		await this.aquecerSessao(jid)

		// Envia o texto antes do PDF: garante que o destinatário tenha sessão
		// de cripto pronta antes do anexo (evita "Aguardando mensagem").
		if (legenda) {
			const textoEnviado = await this.socket.sendMessage(jid, { text: legenda })
			this.cachearMensagem(textoEnviado?.key, textoEnviado?.message)
			// Pequena pausa entre o texto e o PDF: dá tempo do app do
			// destinatário processar a primeira mensagem e estabelecer a sessão
			// Signal antes do anexo chegar.
			await delay(800)
		}

		const docEnviado = await this.socket.sendMessage(jid, {
			document: documento.buffer,
			mimetype: documento.mimetype,
			fileName: documento.nomeArquivo,
		})
		this.cachearMensagem(docEnviado?.key, docEnviado?.message)
	}

	private cachearMensagem(
		key: WAMessageKey | null | undefined,
		message: WAMessageContent | null | undefined,
	): void {
		if (!key?.id || !message) return
		if (this.mensagensEnviadas.size >= LIMITE_CACHE_MENSAGENS) {
			const maisAntiga = this.mensagensEnviadas.keys().next().value
			if (maisAntiga) this.mensagensEnviadas.delete(maisAntiga)
		}
		this.mensagensEnviadas.set(key.id, message)
	}

	private getMessage = async (
		key: WAMessageKey,
	): Promise<WAMessageContent | undefined> => {
		if (!key.id) return undefined
		return this.mensagensEnviadas.get(key.id)
	}

	/**
	 * Descobre o JID real do destinatário usando `onWhatsApp` do Baileys.
	 *
	 * Em números brasileiros, a regra do "9 adicional" foi nacionalizada
	 * entre 2012-2016. Linhas registradas no WhatsApp ANTES dessa migração
	 * continuam armazenadas na rede sem o 9 (ex.: `558298765432`), mesmo que
	 * o telefone no nosso banco esteja salvo com 11 dígitos (`5592987654321`).
	 * Mandar mensagem para o JID errado falha em silêncio — o cliente nunca
	 * recebe nada. Por isso perguntamos ao próprio WhatsApp qual JID está
	 * registrado, testando ambos os formatos.
	 */
	private async resolverJid(destinatario: string): Promise<string> {
		if (destinatario.includes('@')) return destinatario

		const apenasDigitos = destinatario.replace(/\D/g, '')
		const comDdi = apenasDigitos.startsWith('55') ? apenasDigitos : `55${apenasDigitos}`

		const cacheado = this.jidCache.get(comDdi)
		if (cacheado) return cacheado

		const candidatos = gerarCandidatosBr(comDdi)
		const jidPadrao = `${comDdi}@s.whatsapp.net`

		if (!this.socket) return jidPadrao

		try {
			const resultados = await this.socket.onWhatsApp(...candidatos)
			const valido = resultados.find((r) => r.exists)
			if (valido?.jid) {
				this.jidCache.set(comDdi, valido.jid)
				if (valido.jid !== jidPadrao) {
					this.logger.info(
						`JID resolvido: ${comDdi} → ${valido.jid} (formato diferente do telefone)`,
					)
				}
				return valido.jid
			}
			this.logger.warn(
				`Nenhum JID válido para ${comDdi}. Candidatos testados: ${candidatos.join(', ')}. Mensagem pode não chegar.`,
			)
		} catch (err) {
			this.logger.warn('Falha ao consultar onWhatsApp, usando JID padrão', err)
		}

		return jidPadrao
	}

	/**
	 * Pequeno handshake de presença antes de enviar mídia. Resolve o caso em
	 * que o cliente do destinatário recebe "Aguardando mensagem" porque a
	 * sessão de criptografia ainda não foi estabelecida.
	 */
	private async aquecerSessao(jid: string): Promise<void> {
		if (!this.socket) return
		try {
			await this.socket.presenceSubscribe(jid)
			await this.socket.sendPresenceUpdate('available')
			await this.socket.sendPresenceUpdate('composing', jid)
			await delay(600)
			await this.socket.sendPresenceUpdate('paused', jid)
		} catch (err) {
			this.logger.warn('Falha ao aquecer sessão antes do envio', err)
		}
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
			// Precisa estar online para o destinatário conseguir buscar mídia
			// (sem isso o WhatsApp do cliente fica em "Aguardando mensagem").
			markOnlineOnConnect: true,
			syncFullHistory: false,
			// Sem isso o Baileys não consegue responder aos pedidos de retry
			// do destinatário e a mensagem fica eternamente como
			// "Aguardando mensagem…" no app dele.
			getMessage: this.getMessage,
			// O timeout padrão (60s) é estourado pelas "init queries" em redes
			// mais lentas, abortando o setup interno (fetchProps, app-state
			// sync). Sem timeout, o Baileys espera o servidor responder no
			// próprio ritmo — eventos de envio/recebimento continuam normais.
			defaultQueryTimeoutMs: undefined,
			// Tempo extra para o handshake TCP/WS quando a primeira conexão é
			// lenta — evita reconexões em loop.
			connectTimeoutMs: 60_000,
			// Mantém o socket vivo em NATs/firewalls corporativos.
			keepAliveIntervalMs: 25_000,
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

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Para um número brasileiro já com DDI 55, gera as variantes "com 9" e
 * "sem 9" para que o WhatsApp diga qual está registrada.
 *
 * Formato BR completo:
 *   - 13 dígitos (com 9): 55 + DDD(2) + 9 + 8 dígitos = 5592991234567
 *   - 12 dígitos (sem 9): 55 + DDD(2) +     8 dígitos = 559234567890
 *
 * Para outros DDIs/formatos retorna apenas o número original.
 */
function gerarCandidatosBr(comDdi: string): string[] {
	if (!comDdi.startsWith('55')) return [comDdi]

	if (comDdi.length === 13 && comDdi[4] === '9') {
		const semNove = comDdi.slice(0, 4) + comDdi.slice(5)
		return [comDdi, semNove]
	}
	if (comDdi.length === 12) {
		const comNove = comDdi.slice(0, 4) + '9' + comDdi.slice(4)
		return [comDdi, comNove]
	}
	return [comDdi]
}

export const whatsappService = new WhatsAppService()
