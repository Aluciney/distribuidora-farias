import { ErroDeDominio } from './erro-dominio'

export class Proibido extends ErroDeDominio {
	constructor(codigo = 'PROIBIDO', mensagem = 'Acesso proibido para este perfil.') {
		super(codigo, mensagem, 403)
		this.name = 'Proibido'
	}
}
