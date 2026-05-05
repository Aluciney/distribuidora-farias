import { ErroDeDominio } from './erro-dominio'

export class NaoEncontrado extends ErroDeDominio {
	constructor(recurso: string, id?: string) {
		super('NAO_ENCONTRADO', `${recurso} não encontrado.`, 404, id ? { id } : undefined)
		this.name = 'NaoEncontrado'
	}
}
