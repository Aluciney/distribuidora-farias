import { ErroDeDominio } from './erro-dominio'

export class NaoAutorizado extends ErroDeDominio {
	constructor(codigo = 'NAO_AUTORIZADO', mensagem = 'Não autorizado.') {
		super(codigo, mensagem, 401)
		this.name = 'NaoAutorizado'
	}
}
