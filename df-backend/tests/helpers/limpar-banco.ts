import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TABELAS = [
	'notificacoes',
	'acoes_regua',
	'regras_cobranca',
	'faturas',
	'itens_pedido',
	'pedidos',
	'produtos',
	'clientes',
	'usuarios',
	'configuracoes_cobranca',
]

export async function limparBanco() {
	const lista = TABELAS.map((t) => `"${t}"`).join(', ')
	await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE;`)
}

export { prisma as prismaTest }
