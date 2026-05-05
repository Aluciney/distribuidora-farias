import { ErroDeDominio } from './erro-dominio'

export class Conflito extends ErroDeDominio {
	constructor(codigo: string, mensagem: string, detalhes?: Record<string, unknown>) {
		super(codigo, mensagem, 409, detalhes)
		this.name = 'Conflito'
	}
}
