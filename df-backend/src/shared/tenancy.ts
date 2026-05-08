import type { Cliente, PrismaClient, UsuarioCliente } from '@prisma/client'
import { Proibido } from './erros'

/**
 * Resolve a lista de IDs de Clientes (filiais) acessíveis pela holding logada.
 * Usado em todas as rotas do portal para garantir o filtro de tenancy:
 * uma holding só vê faturas/dashboard/notificações dos Clientes vinculados a
 * ela via `UsuarioClienteAcesso`.
 */
export async function obterClientesAcessiveis(
	prisma: PrismaClient,
	usuarioClienteId: string,
): Promise<string[]> {
	const acessos = await prisma.usuarioClienteAcesso.findMany({
		where: { usuarioClienteId },
		select: { clienteId: true },
	})
	return acessos.map((a) => a.clienteId)
}

/**
 * Garante que o `clienteId` informado pertence à holding logada. Útil em
 * detalhe/ação por id (paga fatura, atualiza filial). Lança `Proibido` se
 * não pertencer.
 */
export async function garantirAcessoCliente(
	prisma: PrismaClient,
	usuarioClienteId: string,
	clienteId: string,
): Promise<void> {
	const existe = await prisma.usuarioClienteAcesso.findUnique({
		where: { usuarioClienteId_clienteId: { usuarioClienteId, clienteId } },
		select: { id: true },
	})
	if (!existe) throw new Proibido('FILIAL_INACESSIVEL', 'Filial não pertence à sua conta.')
}

/**
 * Retorna os UsuarioCliente ativos vinculados a um Cliente. Usado pela régua
 * e canais de cobrança para resolver para quem mandar email/whatsapp/push.
 * Se vazio, a filial está órfã e a notificação é registrada com erro.
 */
export async function obterResponsaveisDoCliente(
	prisma: PrismaClient,
	clienteId: string,
): Promise<UsuarioCliente[]> {
	const acessos = await prisma.usuarioClienteAcesso.findMany({
		where: { clienteId, usuarioCliente: { ativo: true } },
		include: { usuarioCliente: true },
	})
	return acessos.map((a) => a.usuarioCliente)
}

/**
 * Retorna todas as filiais (Cliente) acessíveis por um UsuarioCliente,
 * incluindo a flag `principal`. Usado em listagens que precisam de detalhe
 * da filial (perfil, seletor de filial).
 */
export async function obterFiliaisDoUsuarioCliente(
	prisma: PrismaClient,
	usuarioClienteId: string,
): Promise<Array<Cliente & { principal: boolean }>> {
	const acessos = await prisma.usuarioClienteAcesso.findMany({
		where: { usuarioClienteId },
		include: { cliente: true },
	})
	return acessos.map((a) => ({ ...a.cliente, principal: a.principal }))
}
