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

-- CreateIndex
CREATE INDEX "codigos_recuperacao_senha_tipo_entidade_id_idx" ON "codigos_recuperacao_senha"("tipo", "entidade_id");
