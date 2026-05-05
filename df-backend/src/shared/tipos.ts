export interface SessaoToken {
	sub: string
	tipo: 'ADMIN' | 'CLIENTE'
	perfil?: 'ADMIN' | 'FINANCEIRO'
	iat?: number
	exp?: number
}

export interface PaginacaoEntrada {
	pagina?: number
	porPagina?: number
}

export interface ListagemPaginada<T> {
	itens: T[]
	total: number
	pagina: number
	porPagina: number
}
