-- CreateTable
CREATE TABLE "dispositivos_push" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "plataforma" TEXT,
    "ultimo_uso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivos_push_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_push_token_key" ON "dispositivos_push"("token");

-- CreateIndex
CREATE INDEX "dispositivos_push_cliente_id_idx" ON "dispositivos_push"("cliente_id");

-- AddForeignKey
ALTER TABLE "dispositivos_push" ADD CONSTRAINT "dispositivos_push_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
