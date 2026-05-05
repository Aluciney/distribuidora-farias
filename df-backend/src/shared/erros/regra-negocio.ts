import { ErroDeDominio } from './erro-dominio'

export class RegraNegocio extends ErroDeDominio {
	constructor(codigo: string, mensagem: string, detalhes?: Record<string, unknown>) {
		super(codigo, mensagem, 422, detalhes)
		this.name = 'RegraNegocio'
	}
}
