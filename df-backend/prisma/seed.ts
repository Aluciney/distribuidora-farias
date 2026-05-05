import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { addDays, subDays } from 'date-fns'
import { BoletoMockGerador } from '../src/modules/cobrancas/boleto.gerador'
import { PixMockGerador } from '../src/modules/cobrancas/pix.gerador'

const prisma = new PrismaClient()

const SENHA_PADRAO = 'df2026'

async function seed() {
	const senhaHash = await bcrypt.hash(SENHA_PADRAO, 4)

	console.log('🌱 Limpando banco...')
	await prisma.notificacao.deleteMany()
	await prisma.acaoRegua.deleteMany()
	await prisma.regraCobranca.deleteMany()
	await prisma.fatura.deleteMany()
	await prisma.itemPedido.deleteMany()
	await prisma.pedido.deleteMany()
	await prisma.produto.deleteMany()
	await prisma.cliente.deleteMany()
	await prisma.usuario.deleteMany()
	await prisma.configuracoesCobranca.deleteMany()

	console.log('🌱 Configurações de cobrança...')
	const config = await prisma.configuracoesCobranca.create({
		data: {
			id: 'unica',
			beneficiarioCnpj: '12345678000199',
			beneficiarioRazaoSocial: 'Distribuidora Farias LTDA',
			beneficiarioNomeFantasia: 'DF Distribuidora',
			beneficiarioCep: '66000000',
			beneficiarioLogradouro: 'Av. Comercial',
			beneficiarioNumero: '1000',
			beneficiarioBairro: 'Centro',
			beneficiarioCidade: 'Belém',
			beneficiarioUf: 'PA',
			bancoCodigo: '341',
			bancoNome: 'Itaú Unibanco',
			bancoAgencia: '1234',
			bancoAgenciaDigito: '5',
			bancoConta: '67890',
			bancoContaDigito: '0',
			bancoCarteira: '109',
			bancoConvenio: null,
			bancoProximoNossoNumero: 1,
			pixTipoChave: 'CNPJ',
			pixChave: '12345678000199',
			encargosMultaPercentual: 2,
			encargosJurosMensalPercentual: 1,
			encargosDescontoAntecipadoDias: 3,
			encargosDescontoPercentual: 0,
			encargosMensagemPadrao: 'Após o vencimento, multa de 2% e juros de 1% ao mês.',
		},
	})

	console.log('🌱 Usuários...')
	await prisma.usuario.createMany({
		data: [
			{ nome: 'Aluciney Wanderley', email: 'aluciney@df.com', senhaHash, perfil: 'ADMIN', ativo: true },
			{ nome: 'Mariana Oliveira', email: 'mariana@df.com', senhaHash, perfil: 'FINANCEIRO', ativo: true },
			{ nome: 'Roberto Carvalho', email: 'roberto@df.com', senhaHash, perfil: 'FINANCEIRO', ativo: true },
			{ nome: 'Carla Mendes', email: 'carla@df.com', senhaHash, perfil: 'FINANCEIRO', ativo: false },
		],
	})

	console.log('🌱 Clientes...')
	const clientesSeed = [
		{
			cnpj: '11444777000161',
			razaoSocial: 'Mercado Central LTDA',
			nomeFantasia: 'Mercado Central',
			email: 'contato@mercadocentral.com.br',
			telefone: '91988887777',
			status: 'ATIVO' as const,
			limiteCredito: 5000000,
			cep: '66010100',
			logradouro: 'Av. Presidente Vargas',
			numero: '500',
			bairro: 'Campina',
			cidade: 'Belém',
			uf: 'PA',
		},
		{
			cnpj: '34028316000103',
			razaoSocial: 'Supermercado Boa Compra LTDA',
			nomeFantasia: 'Boa Compra',
			email: 'financeiro@boacompra.com.br',
			telefone: '91977776666',
			status: 'ATIVO' as const,
			limiteCredito: 8000000,
			cep: '66060001',
			logradouro: 'Rua dos Mundurucus',
			numero: '2000',
			bairro: 'Cremação',
			cidade: 'Belém',
			uf: 'PA',
		},
		{
			cnpj: '00360305000104',
			razaoSocial: 'Atacado Norte LTDA',
			nomeFantasia: 'Atacado Norte',
			email: 'compras@atacadonorte.com.br',
			telefone: '91966665555',
			status: 'ATIVO' as const,
			limiteCredito: 12000000,
			cep: '66115000',
			logradouro: 'Rod. Augusto Montenegro',
			numero: '5500',
			bairro: 'Parque Verde',
			cidade: 'Belém',
			uf: 'PA',
		},
		{
			cnpj: '60746948000112',
			razaoSocial: 'Conveniência Rápida ME',
			nomeFantasia: 'Rápida 24h',
			email: 'rapida24h@gmail.com',
			telefone: '91955554444',
			status: 'INATIVO' as const,
			limiteCredito: 1500000,
			cep: '66085145',
			logradouro: 'Tv. Castelo Branco',
			numero: '300',
			bairro: 'Marco',
			cidade: 'Belém',
			uf: 'PA',
		},
		{
			cnpj: '15436940000103',
			razaoSocial: 'Padaria Do Bairro EIRELI',
			nomeFantasia: 'Pão Bom',
			email: 'padaria@paobom.com.br',
			telefone: '91944443333',
			status: 'ATIVO' as const,
			limiteCredito: 800000,
			cep: '66050000',
			logradouro: 'Rua João Diogo',
			numero: '120',
			bairro: 'Cidade Velha',
			cidade: 'Belém',
			uf: 'PA',
		},
		{
			cnpj: '47960950000121',
			razaoSocial: 'Empório Sabores LTDA',
			nomeFantasia: 'Empório Sabores',
			email: 'sabores@emporio.com.br',
			telefone: '91933332222',
			status: 'BLOQUEADO' as const,
			limiteCredito: 2500000,
			cep: '66040000',
			logradouro: 'Av. Nazaré',
			numero: '888',
			bairro: 'Nazaré',
			cidade: 'Belém',
			uf: 'PA',
		},
	]

	const clientes = await Promise.all(
		clientesSeed.map((c) =>
			prisma.cliente.create({
				data: {
					cnpj: c.cnpj,
					razaoSocial: c.razaoSocial,
					nomeFantasia: c.nomeFantasia,
					email: c.email,
					telefone: c.telefone,
					status: c.status,
					limiteCredito: c.limiteCredito,
					senhaHash,
					enderecoCep: c.cep,
					enderecoLogradouro: c.logradouro,
					enderecoNumero: c.numero,
					enderecoBairro: c.bairro,
					enderecoCidade: c.cidade,
					enderecoUf: c.uf,
				},
			}),
		),
	)

	console.log('🌱 Produtos...')
	const produtosSeed = [
		{ sku: 'ARR-001', descricao: 'Arroz Branco Tipo 1 - 5kg', unidade: 'PCT', preco: 2890, estoque: 1200 },
		{ sku: 'FEI-002', descricao: 'Feijão Carioca 1kg', unidade: 'PCT', preco: 990, estoque: 800 },
		{ sku: 'OLE-003', descricao: 'Óleo de Soja 900ml', unidade: 'UN', preco: 850, estoque: 1500 },
		{ sku: 'ACU-004', descricao: 'Açúcar Cristal 1kg', unidade: 'PCT', preco: 590, estoque: 1000 },
		{ sku: 'CAF-005', descricao: 'Café Torrado e Moído 500g', unidade: 'UN', preco: 1990, estoque: 600 },
		{ sku: 'LEI-006', descricao: 'Leite Integral UHT 1L', unidade: 'CX', preco: 540, estoque: 2400 },
		{ sku: 'MAC-007', descricao: 'Macarrão Espaguete 500g', unidade: 'PCT', preco: 480, estoque: 1100 },
		{ sku: 'FAR-008', descricao: 'Farinha de Mandioca 1kg', unidade: 'PCT', preco: 720, estoque: 700 },
		{ sku: 'SAL-009', descricao: 'Sal Refinado 1kg', unidade: 'PCT', preco: 280, estoque: 900 },
		{ sku: 'BIS-010', descricao: 'Biscoito Cream Cracker 400g', unidade: 'PCT', preco: 540, estoque: 800 },
		{ sku: 'REF-011', descricao: 'Refrigerante Cola 2L', unidade: 'UN', preco: 990, estoque: 600 },
		{ sku: 'AGU-012', descricao: 'Água Mineral 500ml', unidade: 'UN', preco: 290, estoque: 3000 },
	]
	await prisma.produto.createMany({ data: produtosSeed })

	console.log('🌱 Pedidos...')
	const hoje = new Date()
	const pedidosSeed = [
		{ numero: 'PED-2026-0001', clienteIdx: 0, valorTotal: 285000, status: 'FATURADO' as const, emitidoEm: subDays(hoje, 10) },
		{ numero: 'PED-2026-0002', clienteIdx: 1, valorTotal: 480000, status: 'FATURADO' as const, emitidoEm: subDays(hoje, 8) },
		{ numero: 'PED-2026-0003', clienteIdx: 2, valorTotal: 1250000, status: 'FATURADO' as const, emitidoEm: subDays(hoje, 5) },
		{ numero: 'PED-2026-0004', clienteIdx: 4, valorTotal: 95000, status: 'ABERTO' as const, emitidoEm: subDays(hoje, 2) },
		{ numero: 'PED-2026-0005', clienteIdx: 0, valorTotal: 320000, status: 'FATURADO' as const, emitidoEm: subDays(hoje, 35) },
	]

	const pedidos = await Promise.all(
		pedidosSeed.map((p) =>
			prisma.pedido.create({
				data: {
					numero: p.numero,
					clienteId: clientes[p.clienteIdx].id,
					valorTotal: p.valorTotal,
					status: p.status,
					emitidoEm: p.emitidoEm,
					origem: 'ERP',
					itens: {
						create: [{ descricao: 'Itens diversos do pedido', quantidade: 1, valorUnitario: p.valorTotal, valorTotal: p.valorTotal }],
					},
				},
			}),
		),
	)

	console.log('🌱 Faturas (com Boleto + PIX)...')
	const boleto = new BoletoMockGerador()
	const pix = new PixMockGerador()

	const faturasSeed = [
		{ numero: 'FAT-2026-0001', pedidoIdx: 0, valor: 285000, status: 'PENDENTE' as const, vencEm: addDays(hoje, 5) },
		{ numero: 'FAT-2026-0002', pedidoIdx: 1, valor: 480000, status: 'PENDENTE' as const, vencEm: addDays(hoje, 12) },
		{ numero: 'FAT-2026-0003', pedidoIdx: 2, valor: 1250000, status: 'VENCIDO' as const, vencEm: subDays(hoje, 3) },
		{ numero: 'FAT-2026-0004', pedidoIdx: 4, valor: 320000, status: 'PAGO' as const, vencEm: subDays(hoje, 20), pago: true },
		{ numero: 'FAT-2026-0005', pedidoIdx: 0, valor: 150000, status: 'VENCIDO' as const, vencEm: subDays(hoje, 40) },
		{ numero: 'FAT-2026-0006', pedidoIdx: 1, valor: 210000, status: 'PAGO' as const, vencEm: subDays(hoje, 10), pago: true },
	]

	let nossoNumero = config.bancoProximoNossoNumero
	for (const f of faturasSeed) {
		const ped = pedidos[f.pedidoIdx]
		const nn = String(nossoNumero++).padStart(8, '0')
		const b = await boleto.gerar({ valor: f.valor, dataVencimento: f.vencEm, nossoNumero: nn, config })
		const p = await pix.gerar({ valor: f.valor, config })
		await prisma.fatura.create({
			data: {
				numero: f.numero,
				pedidoId: ped.id,
				clienteId: ped.clienteId,
				valor: f.valor,
				valorPago: f.pago ? f.valor : null,
				status: f.status,
				dataEmissao: subDays(f.vencEm, 30),
				dataVencimento: f.vencEm,
				dataPagamento: f.pago ? subDays(f.vencEm, 1) : null,
				boletoLinhaDigitavel: b.linhaDigitavel,
				boletoCodigoBarras: b.codigoBarras,
				boletoNossoNumero: b.nossoNumero,
				pixCopiaECola: p.copiaECola,
				pixQrCode: p.qrCode,
				pixTxid: p.txid,
				pixExpiraEm: p.expiraEm,
				pagamentoMetodo: f.pago ? 'PIX' : null,
			},
		})
	}
	await prisma.configuracoesCobranca.update({
		where: { id: 'unica' },
		data: { bancoProximoNossoNumero: nossoNumero },
	})

	console.log('🌱 Regras de cobrança...')
	await prisma.regraCobranca.create({
		data: {
			nome: 'Lembrete 3 dias antes',
			descricao: 'Email amistoso 3 dias antes do vencimento.',
			gatilho: 'ANTES_VENCIMENTO',
			diasOffset: -3,
			ativo: true,
			acoes: {
				create: [
					{
						canal: 'EMAIL',
						assunto: 'Sua fatura vence em 3 dias',
						mensagem: 'Olá {{cliente}}, sua fatura {{numero}} no valor de {{valor}} vence em {{vencimento}}.',
					},
				],
			},
		},
	})
	await prisma.regraCobranca.create({
		data: {
			nome: 'Aviso no dia do vencimento',
			gatilho: 'DIA_VENCIMENTO',
			diasOffset: 0,
			ativo: true,
			acoes: {
				create: [
					{ canal: 'EMAIL', assunto: 'Vencimento hoje', mensagem: 'Olá {{cliente}}, sua fatura {{numero}} vence hoje.' },
					{ canal: 'WHATSAPP', mensagem: 'Olá {{cliente}}, sua fatura {{numero}} vence hoje. Boleto: {{linha}}' },
				],
			},
		},
	})
	await prisma.regraCobranca.create({
		data: {
			nome: 'Cobrança 3 dias após vencimento',
			gatilho: 'APOS_VENCIMENTO',
			diasOffset: 3,
			ativo: true,
			acoes: {
				create: [
					{
						canal: 'EMAIL',
						assunto: 'Fatura em atraso',
						mensagem: 'Olá {{cliente}}, sua fatura {{numero}} venceu há 3 dias. Por favor, regularize.',
					},
				],
			},
		},
	})
	await prisma.regraCobranca.create({
		data: {
			nome: 'Cobrança 15 dias após vencimento',
			gatilho: 'APOS_VENCIMENTO',
			diasOffset: 15,
			ativo: false,
			acoes: {
				create: [{ canal: 'SMS', mensagem: 'DF: fatura {{numero}} em atraso há 15 dias. Pague via PIX: {{pix}}' }],
			},
		},
	})

	console.log('✅ Seed concluído.')
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
