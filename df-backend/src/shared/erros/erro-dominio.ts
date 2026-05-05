export class ErroDeDominio extends Error {
	constructor(
		public readonly codigo: string,
		mensagem: string,
		public readonly statusCode: number = 400,
		public readonly detalhes?: Record<string, unknown>,
	) {
		super(mensagem)
		this.name = 'ErroDeDominio'
	}
}
