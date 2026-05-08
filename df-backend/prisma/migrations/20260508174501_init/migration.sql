-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'FINANCEIRO');

-- CreateEnum
CREATE TYPE "StatusCliente" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('ABERTO', 'FATURADO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OrigemPedido" AS ENUM ('ERP', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusFatura" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('BOLETO', 'PIX', 'CARTAO_CREDITO', 'DINHEIRO');

-- CreateEnum
CREATE TYPE "GatilhoRegua" AS ENUM ('ANTES_VENCIMENTO', 'DIA_VENCIMENTO', 'APOS_VENCIMENTO');

-- CreateEnum
CREATE TYPE "CanalNotificacao" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "TipoChavePix" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acesso" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "inscricao_estadual" TEXT,
    "status" "StatusCliente" NOT NULL DEFAULT 'ATIVO',
    "limite_credito" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "endereco_cep" TEXT NOT NULL,
    "endereco_logradouro" TEXT NOT NULL,
    "endereco_numero" TEXT NOT NULL,
    "endereco_complemento" TEXT,
    "endereco_bairro" TEXT NOT NULL,
    "endereco_cidade" TEXT NOT NULL,
    "endereco_uf" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "senha_hash" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acesso" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_cliente_acessos" (
    "id" TEXT NOT NULL,
    "usuario_cliente_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_cliente_acessos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivos_push" (
    "id" TEXT NOT NULL,
    "usuario_cliente_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "plataforma" TEXT,
    "ultimo_uso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivos_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigos_recuperacao_senha" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "codigo_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codigos_recuperacao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "valor_total" INTEGER NOT NULL,
    "status" "StatusPedido" NOT NULL,
    "emitido_em" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "origem" "OrigemPedido" NOT NULL DEFAULT 'ERP',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "produto_id" TEXT,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_unitario" INTEGER NOT NULL,
    "valor_total" INTEGER NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "preco" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faturas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "valor_pago" INTEGER,
    "status" "StatusFatura" NOT NULL DEFAULT 'PENDENTE',
    "data_emissao" TIMESTAMP(3) NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "boleto_linha_digitavel" TEXT NOT NULL,
    "boleto_codigo_barras" TEXT NOT NULL,
    "boleto_nosso_numero" TEXT NOT NULL,
    "boleto_url" TEXT,
    "pix_copia_e_cola" TEXT NOT NULL,
    "pix_qr_code" TEXT NOT NULL,
    "pix_txid" TEXT NOT NULL,
    "pix_expira_em" TIMESTAMP(3),
    "pagamento_metodo" "MetodoPagamento",
    "pagamento_cartao_bandeira" TEXT,
    "pagamento_cartao_ultimos_digitos" TEXT,
    "pagamento_cartao_parcelas" INTEGER,
    "pagamento_cartao_auth_id" TEXT,
    "motivo_cancelamento" TEXT,
    "cancelado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_cobranca" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "gatilho" "GatilhoRegua" NOT NULL,
    "dias_offset" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regras_cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acoes_regua" (
    "id" TEXT NOT NULL,
    "regra_id" TEXT NOT NULL,
    "canal" "CanalNotificacao" NOT NULL,
    "assunto" TEXT,
    "mensagem" TEXT NOT NULL,

    CONSTRAINT "acoes_regua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "usuario_cliente_id" TEXT,
    "fatura_id" TEXT,
    "regra_id" TEXT,
    "canal" "CanalNotificacao",
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "enviada_em" TIMESTAMP(3),
    "lida_em" TIMESTAMP(3),
    "erro" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_cobranca" (
    "id" TEXT NOT NULL DEFAULT 'unica',
    "beneficiario_cnpj" TEXT NOT NULL,
    "beneficiario_razao_social" TEXT NOT NULL,
    "beneficiario_nome_fantasia" TEXT,
    "beneficiario_cep" TEXT NOT NULL,
    "beneficiario_logradouro" TEXT NOT NULL,
    "beneficiario_numero" TEXT NOT NULL,
    "beneficiario_complemento" TEXT,
    "beneficiario_bairro" TEXT NOT NULL,
    "beneficiario_cidade" TEXT NOT NULL,
    "beneficiario_uf" TEXT NOT NULL,
    "banco_codigo" TEXT NOT NULL,
    "banco_nome" TEXT NOT NULL,
    "banco_agencia" TEXT NOT NULL,
    "banco_agencia_digito" TEXT,
    "banco_conta" TEXT NOT NULL,
    "banco_conta_digito" TEXT NOT NULL,
    "banco_carteira" TEXT NOT NULL,
    "banco_convenio" TEXT,
    "banco_proximo_nosso_numero" INTEGER NOT NULL DEFAULT 1,
    "pix_tipo_chave" "TipoChavePix" NOT NULL,
    "pix_chave" TEXT NOT NULL,
    "encargos_multa_percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "encargos_juros_mensal_percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "encargos_desconto_antecipado_dias" INTEGER NOT NULL DEFAULT 0,
    "encargos_desconto_percentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "encargos_mensagem_padrao" TEXT,
    "whatsapp_mensagem_boleto" TEXT,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cnpj_key" ON "clientes"("cnpj");

-- CreateIndex
CREATE INDEX "clientes_cnpj_idx" ON "clientes"("cnpj");

-- CreateIndex
CREATE INDEX "clientes_status_idx" ON "clientes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cliente_email_key" ON "usuarios_cliente"("email");

-- CreateIndex
CREATE INDEX "usuarios_cliente_email_idx" ON "usuarios_cliente"("email");

-- CreateIndex
CREATE INDEX "usuarios_cliente_acessos_cliente_id_idx" ON "usuarios_cliente_acessos"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cliente_acessos_usuario_cliente_id_cliente_id_key" ON "usuarios_cliente_acessos"("usuario_cliente_id", "cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_push_token_key" ON "dispositivos_push"("token");

-- CreateIndex
CREATE INDEX "dispositivos_push_usuario_cliente_id_idx" ON "dispositivos_push"("usuario_cliente_id");

-- CreateIndex
CREATE INDEX "codigos_recuperacao_senha_tipo_entidade_id_idx" ON "codigos_recuperacao_senha"("tipo", "entidade_id");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "produtos"("sku");

-- CreateIndex
CREATE INDEX "produtos_sku_idx" ON "produtos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_numero_key" ON "faturas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "faturas_pix_txid_key" ON "faturas"("pix_txid");

-- CreateIndex
CREATE INDEX "faturas_cliente_id_idx" ON "faturas"("cliente_id");

-- CreateIndex
CREATE INDEX "faturas_pedido_id_idx" ON "faturas"("pedido_id");

-- CreateIndex
CREATE INDEX "faturas_status_idx" ON "faturas"("status");

-- CreateIndex
CREATE INDEX "faturas_data_vencimento_idx" ON "faturas"("data_vencimento");

-- CreateIndex
CREATE INDEX "regras_cobranca_ativo_idx" ON "regras_cobranca"("ativo");

-- CreateIndex
CREATE INDEX "acoes_regua_regra_id_idx" ON "acoes_regua"("regra_id");

-- CreateIndex
CREATE INDEX "notificacoes_cliente_id_idx" ON "notificacoes"("cliente_id");

-- CreateIndex
CREATE INDEX "notificacoes_usuario_cliente_id_idx" ON "notificacoes"("usuario_cliente_id");

-- CreateIndex
CREATE INDEX "notificacoes_fatura_id_idx" ON "notificacoes"("fatura_id");

-- CreateIndex
CREATE INDEX "notificacoes_lida_em_idx" ON "notificacoes"("lida_em");

-- AddForeignKey
ALTER TABLE "usuarios_cliente_acessos" ADD CONSTRAINT "usuarios_cliente_acessos_usuario_cliente_id_fkey" FOREIGN KEY ("usuario_cliente_id") REFERENCES "usuarios_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_cliente_acessos" ADD CONSTRAINT "usuarios_cliente_acessos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos_push" ADD CONSTRAINT "dispositivos_push_usuario_cliente_id_fkey" FOREIGN KEY ("usuario_cliente_id") REFERENCES "usuarios_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faturas" ADD CONSTRAINT "faturas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes_regua" ADD CONSTRAINT "acoes_regua_regra_id_fkey" FOREIGN KEY ("regra_id") REFERENCES "regras_cobranca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuario_cliente_id_fkey" FOREIGN KEY ("usuario_cliente_id") REFERENCES "usuarios_cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_fatura_id_fkey" FOREIGN KEY ("fatura_id") REFERENCES "faturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
