# BACKEND — DF Pagamentos (Distribuidora Farias)

Especificação completa para implementação do backend do sistema de pagamentos
da Distribuidora Farias. Este documento é a fonte de verdade para criar o
serviço que substituirá os mocks atuais do frontend (`df-web`).

> **Princípio fundamental**: o backend deve servir 100% das operações que o
> frontend já implementa. Nenhum mock do frontend deve sobreviver à entrega
> final — todos serão substituídos por chamadas HTTP reais.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Stack técnica](#2-stack-técnica)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Banco de dados (Prisma + Postgres)](#5-banco-de-dados-prisma--postgres)
6. [Padrões e convenções](#6-padrões-e-convenções)
7. [Autenticação e autorização](#7-autenticação-e-autorização)
8. [Documentação automática (Swagger)](#8-documentação-automática-swagger)
9. [Endpoints por módulo](#9-endpoints-por-módulo)
10. [Geração de Boleto e PIX](#10-geração-de-boleto-e-pix)
11. [Régua de cobrança e notificações](#11-régua-de-cobrança-e-notificações)
12. [Estratégia de testes (Jest)](#12-estratégia-de-testes-jest)
13. [Plano de implementação por fases](#13-plano-de-implementação-por-fases)
14. [Anexos: trechos de código](#14-anexos-trechos-de-código)

---

## 1. Visão geral

**Nome do serviço**: `df-api`
**Linguagem natural**: pt-BR em TUDO — schema do banco, nomes de colunas,
modelos Prisma, endpoints, DTOs, variáveis e mensagens de erro.
**Responsabilidades**:

- Autenticar usuários internos (Admin/Financeiro) e clientes (CNPJ).
- Servir dados do domínio financeiro (clientes, cobranças, fluxo de caixa,
  inadimplência).
- Gerar Boletos Febraban e PIX a partir das configurações cadastradas.
- Processar pagamentos (baixa manual e cartão de crédito mockado).
- Executar a régua de cobrança e disparar notificações.
- Expor documentação OpenAPI auto-gerada.

**Integrações externas (interfaces, mockadas inicialmente)**:

- ERP de estoque/pedidos (read-only para `pedidos` e `produtos`).
- Gateway de pagamento (cartão).
- Banco emissor (registro/cancelamento de boletos via API Febraban).
- PSP PIX (geração estática + futura cobrança dinâmica).
- Provedores de email/WhatsApp/SMS para a régua.

---

## 2. Stack técnica

| Camada            | Ferramenta                                   | Versão mínima |
| ----------------- | -------------------------------------------- | ------------- |
| Runtime           | Node.js                                      | 22 LTS        |
| Linguagem         | TypeScript (strict)                          | 5.4+          |
| HTTP framework    | Fastify                                      | 4.x           |
| Type provider     | `fastify-type-provider-zod`                  | mais recente  |
| Validação         | Zod                                          | 3.x           |
| Auth              | `@fastify/jwt` + `@fastify/cookie`           | últimas       |
| Documentação      | `@fastify/swagger` + `@fastify/swagger-ui`   | últimas       |
| ORM               | Prisma                                       | 5.x           |
| Banco             | PostgreSQL                                   | 16            |
| Hash de senha     | `bcrypt`                                     | 5.x           |
| Logs              | Pino (default do Fastify)                    | —             |
| Agendamento       | `node-cron` ou `@fastify/schedule`           | últimas       |
| Testes            | Jest + ts-jest + Supertest                   | 29.x / 6.x    |
| Lint/Format       | ESLint + Prettier (mesmas regras do front)   | —             |
| Container         | Docker + docker-compose (Postgres local)     | 24+           |

**Não usar**: ORMs alternativos (TypeORM, Sequelize), runtimes paralelos
(Bun/Deno), Express, swagger-jsdoc. A consistência da stack é parte do
contrato.

---

## 3. Estrutura de pastas

Organização **feature-based** alinhada ao frontend. Cada módulo é um diretório
auto-contido com `routes`, `service`, `schemas` e (quando aplicável)
`integrations`.

```
df-api/
├── src/
│   ├── server.ts                  # bootstrap (listen)
│   ├── app.ts                     # composição do Fastify (registra plugins/módulos)
│   ├── env.ts                     # parse + validação de env via Zod
│   ├── plugins/
│   │   ├── prisma.plugin.ts       # decorate request.prisma + onClose disconnect
│   │   ├── auth.plugin.ts         # JWT + cookie + decorators (requerAdmin/requerCliente)
│   │   ├── swagger.plugin.ts      # registra @fastify/swagger + ui em /docs
│   │   └── error-handler.plugin.ts # setErrorHandler centralizado (ErroDeDominio)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schemas.ts
│   │   ├── usuarios/
│   │   ├── clientes/
│   │   ├── pedidos/
│   │   ├── produtos/
│   │   ├── configuracoes/
│   │   ├── cobrancas/
│   │   │   ├── cobrancas.routes.ts
│   │   │   ├── cobrancas.service.ts
│   │   │   ├── cobrancas.schemas.ts
│   │   │   ├── boleto.gerador.ts          # IBoletoGerador + impl mock
│   │   │   └── pix.gerador.ts             # IPixGerador + impl mock
│   │   ├── inadimplencia/
│   │   ├── fluxo-caixa/
│   │   ├── regras/
│   │   └── notificacoes/
│   │       ├── notificacoes.routes.ts
│   │       ├── notificacoes.service.ts
│   │       ├── regua.worker.ts            # cron para executar regras
│   │       └── canais/
│   │           ├── canal.interface.ts
│   │           ├── email.canal.ts
│   │           ├── whatsapp.canal.ts
│   │           └── sms.canal.ts
│   └── shared/
│       ├── erros/
│       │   ├── erro-dominio.ts             # classe base
│       │   ├── nao-encontrado.ts
│       │   ├── conflito.ts
│       │   ├── nao-autorizado.ts
│       │   └── proibido.ts
│       ├── utils/
│       │   ├── cnpj.ts
│       │   ├── cpf.ts
│       │   ├── moeda.ts                    # helpers centavos↔reais
│       │   └── data.ts
│       └── tipos.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── setup.ts
│   ├── helpers/
│   │   ├── build-app.ts
│   │   ├── limpar-banco.ts
│   │   └── factories/
│   │       ├── usuario.factory.ts
│   │       ├── cliente.factory.ts
│   │       └── ...
│   └── modules/
│       ├── auth.test.ts
│       ├── clientes.test.ts
│       ├── cobrancas.test.ts
│       └── ...
├── docker-compose.yml             # postgres-dev + postgres-test
├── .env.example
├── .env.test
├── .eslintrc.cjs
├── .prettierrc
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Variáveis de ambiente

`.env.example` e validação em `src/env.ts` via Zod. **Falhar no boot** se algum
obrigatório estiver ausente.

| Variável                  | Obrigatória | Default            | Descrição                                       |
| ------------------------- | ----------- | ------------------ | ----------------------------------------------- |
| `NODE_ENV`                | sim         | `development`      | `development` \| `test` \| `production`         |
| `PORT`                    | não         | `3333`             | Porta HTTP                                      |
| `LOG_LEVEL`               | não         | `info`             | Pino log level                                  |
| `DATABASE_URL`            | sim         | —                  | Connection string Postgres                      |
| `JWT_SECRET`              | sim         | —                  | Mínimo 32 chars                                 |
| `JWT_EXPIRES_IN`          | não         | `7d`               | Duração do JWT                                  |
| `COOKIE_SECRET`           | sim         | —                  | Para assinar cookies                            |
| `COOKIE_SECURE`           | não         | `false` em dev     | `true` em prod (HTTPS)                          |
| `CORS_ORIGIN`             | sim         | —                  | Origem do front (`http://localhost:5173` em dev)|
| `BCRYPT_ROUNDS`           | não         | `12`               | Custo do bcrypt                                 |
| `REGUA_CRON`              | não         | `0 9 * * *`        | Quando rodar o worker (default: 09h diário)     |

Scripts no `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --runInBand",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

---

## 5. Banco de dados (Prisma + Postgres)

### 5.1 Convenções

- **Modelos** em PascalCase, em pt-BR (`Usuario`, `Cliente`, `Fatura`).
- **Tabelas** em snake_case, em pt-BR e plural (`usuarios`, `clientes`,
  `faturas`).
- **Colunas** em snake_case, em pt-BR (`razao_social`, `criado_em`).
- **Enums** em PascalCase, valores em SCREAMING_SNAKE em pt-BR.
- **IDs** sempre `String @id @default(uuid())`.
- **Datas**: `criado_em` e `atualizado_em` em todos os modelos persistentes.
- **Valores monetários**: sempre `Int` (centavos). Nada de `Float`.
- **Soft delete**: usar `ativo: Boolean` quando fizer sentido, em vez de
  excluir registros (preserva auditoria).

### 5.2 Schema completo

Arquivo `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =========================================================================
// USUARIOS (equipe interna: ADMIN ou FINANCEIRO)
// =========================================================================

model Usuario {
  id            String    @id @default(uuid())
  nome          String
  email         String    @unique
  senhaHash     String    @map("senha_hash")
  perfil        Perfil
  ativo         Boolean   @default(true)
  ultimoAcesso  DateTime? @map("ultimo_acesso")
  criadoEm      DateTime  @default(now()) @map("criado_em")
  atualizadoEm  DateTime  @updatedAt @map("atualizado_em")

  @@index([email])
  @@map("usuarios")
}

enum Perfil {
  ADMIN
  FINANCEIRO
}

// =========================================================================
// CLIENTES
// =========================================================================

model Cliente {
  id                  String         @id @default(uuid())
  cnpj                String         @unique
  razaoSocial         String         @map("razao_social")
  nomeFantasia        String?        @map("nome_fantasia")
  inscricaoEstadual   String?        @map("inscricao_estadual")
  email               String
  telefone            String
  status              StatusCliente  @default(ATIVO)
  limiteCredito       Int            @default(0) @map("limite_credito")
  observacoes         String?
  /// Hash da senha do portal do cliente. Pode ser null até o primeiro acesso.
  senhaHash           String?        @map("senha_hash")
  // Endereço inline
  enderecoCep         String         @map("endereco_cep")
  enderecoLogradouro  String         @map("endereco_logradouro")
  enderecoNumero      String         @map("endereco_numero")
  enderecoComplemento String?        @map("endereco_complemento")
  enderecoBairro      String         @map("endereco_bairro")
  enderecoCidade      String         @map("endereco_cidade")
  enderecoUf          String         @map("endereco_uf")
  criadoEm            DateTime       @default(now()) @map("criado_em")
  atualizadoEm        DateTime       @updatedAt @map("atualizado_em")

  pedidos        Pedido[]
  faturas        Fatura[]
  notificacoes   Notificacao[]

  @@index([cnpj])
  @@index([status])
  @@map("clientes")
}

enum StatusCliente {
  ATIVO
  INATIVO
  BLOQUEADO
}

// =========================================================================
// PEDIDOS (espelho do ERP — read-only via API)
// =========================================================================

model Pedido {
  id           String        @id @default(uuid())
  numero       String        @unique
  clienteId    String        @map("cliente_id")
  cliente      Cliente       @relation(fields: [clienteId], references: [id])
  valorTotal   Int           @map("valor_total")
  status       StatusPedido
  emitidoEm    DateTime      @map("emitido_em")
  observacoes  String?
  /// Origem do registro: `ERP` (sincronizado) ou `MANUAL`.
  origem       OrigemPedido  @default(ERP)
  criadoEm     DateTime      @default(now()) @map("criado_em")
  atualizadoEm DateTime      @updatedAt @map("atualizado_em")

  itens   ItemPedido[]
  faturas Fatura[]

  @@index([clienteId])
  @@index([status])
  @@map("pedidos")
}

enum StatusPedido {
  ABERTO
  FATURADO
  ENTREGUE
  CANCELADO
}

enum OrigemPedido {
  ERP
  MANUAL
}

model ItemPedido {
  id              String   @id @default(uuid())
  pedidoId        String   @map("pedido_id")
  pedido          Pedido   @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
  produtoId       String?  @map("produto_id")
  produto         Produto? @relation(fields: [produtoId], references: [id])
  descricao       String
  quantidade      Int
  valorUnitario   Int      @map("valor_unitario")
  valorTotal      Int      @map("valor_total")

  @@index([pedidoId])
  @@map("itens_pedido")
}

// =========================================================================
// PRODUTOS (espelho read-only do ERP)
// =========================================================================

model Produto {
  id        String   @id @default(uuid())
  sku       String   @unique
  descricao String
  unidade   String
  preco     Int
  estoque   Int      @default(0)
  ativo     Boolean  @default(true)
  criadoEm  DateTime @default(now()) @map("criado_em")
  atualizadoEm DateTime @updatedAt @map("atualizado_em")

  itensPedido ItemPedido[]

  @@index([sku])
  @@map("produtos")
}

// =========================================================================
// FATURAS (cobrança híbrida: BOLETO + PIX sempre presentes)
// =========================================================================

model Fatura {
  id              String        @id @default(uuid())
  numero          String        @unique
  pedidoId        String        @map("pedido_id")
  pedido          Pedido        @relation(fields: [pedidoId], references: [id])
  clienteId       String        @map("cliente_id")
  cliente         Cliente       @relation(fields: [clienteId], references: [id])
  valor           Int
  valorPago       Int?          @map("valor_pago")
  status          StatusFatura  @default(PENDENTE)
  dataEmissao     DateTime      @map("data_emissao")
  dataVencimento  DateTime      @map("data_vencimento")
  dataPagamento   DateTime?     @map("data_pagamento")
  observacoes     String?

  // Boleto (sempre gerado)
  boletoLinhaDigitavel String   @map("boleto_linha_digitavel")
  boletoCodigoBarras   String   @map("boleto_codigo_barras")
  boletoNossoNumero    String   @map("boleto_nosso_numero")
  boletoUrl            String?  @map("boleto_url")

  // PIX (sempre gerado)
  pixCopiaECola  String         @map("pix_copia_e_cola")
  pixQrCode      String         @map("pix_qr_code")
  pixTxid        String         @unique @map("pix_txid")
  pixExpiraEm    DateTime?      @map("pix_expira_em")

  // Pagamento confirmado (preenchido quando status = PAGO)
  pagamentoMetodo                MetodoPagamento? @map("pagamento_metodo")
  pagamentoCartaoBandeira        String?          @map("pagamento_cartao_bandeira")
  pagamentoCartaoUltimosDigitos  String?          @map("pagamento_cartao_ultimos_digitos")
  pagamentoCartaoParcelas        Int?             @map("pagamento_cartao_parcelas")
  pagamentoCartaoAuthId          String?          @map("pagamento_cartao_auth_id")

  // Cancelamento Febraban
  motivoCancelamento String? @map("motivo_cancelamento")
  canceladoEm        DateTime? @map("cancelado_em")

  criadoEm     DateTime @default(now()) @map("criado_em")
  atualizadoEm DateTime @updatedAt @map("atualizado_em")

  notificacoes Notificacao[]

  @@index([clienteId])
  @@index([pedidoId])
  @@index([status])
  @@index([dataVencimento])
  @@map("faturas")
}

enum StatusFatura {
  PENDENTE
  PAGO
  VENCIDO
  CANCELADO
  ESTORNADO
}

enum MetodoPagamento {
  BOLETO
  PIX
  CARTAO_CREDITO
  DINHEIRO
}

// =========================================================================
// REGRAS DE COBRANCA (régua) + AÇÕES POR CANAL
// =========================================================================

model RegraCobranca {
  id           String         @id @default(uuid())
  nome         String
  descricao    String?
  ativo        Boolean        @default(true)
  gatilho      GatilhoRegua
  /// Negativo = antes do vencimento; 0 = no dia; positivo = após.
  diasOffset   Int            @map("dias_offset")
  criadoEm     DateTime       @default(now()) @map("criado_em")
  atualizadoEm DateTime       @updatedAt @map("atualizado_em")

  acoes AcaoRegua[]

  @@index([ativo])
  @@map("regras_cobranca")
}

enum GatilhoRegua {
  ANTES_VENCIMENTO
  DIA_VENCIMENTO
  APOS_VENCIMENTO
}

model AcaoRegua {
  id        String            @id @default(uuid())
  regraId   String            @map("regra_id")
  regra     RegraCobranca     @relation(fields: [regraId], references: [id], onDelete: Cascade)
  canal     CanalNotificacao
  assunto   String?
  mensagem  String

  @@index([regraId])
  @@map("acoes_regua")
}

enum CanalNotificacao {
  EMAIL
  WHATSAPP
  SMS
}

// =========================================================================
// NOTIFICAÇÕES (audit trail dos disparos da régua + alertas do cliente)
// =========================================================================

model Notificacao {
  id           String           @id @default(uuid())
  clienteId    String           @map("cliente_id")
  cliente      Cliente          @relation(fields: [clienteId], references: [id])
  faturaId     String?          @map("fatura_id")
  fatura       Fatura?          @relation(fields: [faturaId], references: [id])
  regraId      String?          @map("regra_id")
  canal        CanalNotificacao?
  titulo       String
  mensagem     String
  /// `null` = ainda não enviada; `DateTime` = enviada com sucesso.
  enviadaEm    DateTime?        @map("enviada_em")
  /// `null` = não lida; `DateTime` = lida pelo cliente no portal.
  lidaEm       DateTime?        @map("lida_em")
  erro         String?
  criadoEm     DateTime         @default(now()) @map("criado_em")

  @@index([clienteId])
  @@index([faturaId])
  @@index([lidaEm])
  @@map("notificacoes")
}

// =========================================================================
// CONFIGURAÇÕES DE COBRANÇA (singleton — 1 registro)
// =========================================================================

model ConfiguracoesCobranca {
  /// Sempre `unica` — usa-se como singleton.
  id String @id @default("unica")

  // Beneficiário
  beneficiarioCnpj          String  @map("beneficiario_cnpj")
  beneficiarioRazaoSocial   String  @map("beneficiario_razao_social")
  beneficiarioNomeFantasia  String? @map("beneficiario_nome_fantasia")
  beneficiarioCep           String  @map("beneficiario_cep")
  beneficiarioLogradouro    String  @map("beneficiario_logradouro")
  beneficiarioNumero        String  @map("beneficiario_numero")
  beneficiarioComplemento   String? @map("beneficiario_complemento")
  beneficiarioBairro        String  @map("beneficiario_bairro")
  beneficiarioCidade        String  @map("beneficiario_cidade")
  beneficiarioUf            String  @map("beneficiario_uf")

  // Banco
  bancoCodigo               String  @map("banco_codigo")
  bancoNome                 String  @map("banco_nome")
  bancoAgencia              String  @map("banco_agencia")
  bancoAgenciaDigito        String? @map("banco_agencia_digito")
  bancoConta                String  @map("banco_conta")
  bancoContaDigito          String  @map("banco_conta_digito")
  bancoCarteira             String  @map("banco_carteira")
  bancoConvenio             String? @map("banco_convenio")
  bancoProximoNossoNumero   Int     @default(1) @map("banco_proximo_nosso_numero")

  // PIX
  pixTipoChave  TipoChavePix @map("pix_tipo_chave")
  pixChave      String       @map("pix_chave")

  // Encargos
  encargosMultaPercentual         Decimal @db.Decimal(5,2) @default(0) @map("encargos_multa_percentual")
  encargosJurosMensalPercentual   Decimal @db.Decimal(5,2) @default(0) @map("encargos_juros_mensal_percentual")
  encargosDescontoAntecipadoDias  Int     @default(0) @map("encargos_desconto_antecipado_dias")
  encargosDescontoPercentual      Decimal @db.Decimal(5,2) @default(0) @map("encargos_desconto_percentual")
  encargosMensagemPadrao          String? @map("encargos_mensagem_padrao")

  atualizadoEm DateTime @updatedAt @map("atualizado_em")

  @@map("configuracoes_cobranca")
}

enum TipoChavePix {
  CPF
  CNPJ
  EMAIL
  TELEFONE
  ALEATORIA
}
```

### 5.3 Seed inicial (`prisma/seed.ts`)

O seed deve criar dados análogos aos mocks do frontend para que o ambiente
local seja reconhecível por quem testa:

- 4 usuários (1 ADMIN + 3 FINANCEIRO, 1 inativo). Senha de todos: `df2026`
  (hash bcrypt).
- 6 clientes com CNPJs reais válidos (mesmos do `clientes.mock.ts`). Senha do
  portal: `df2026`.
- 12 produtos (mesmos SKUs do `produtos.mock.ts`).
- 5 pedidos faturáveis vinculados aos clientes seed.
- 6 faturas (mistura PENDENTE/PAGO/VENCIDO) com Boleto + PIX gerados.
- 4 regras de cobrança (mesmas seeds da régua).
- 1 registro em `configuracoes_cobranca` com defaults da Distribuidora Farias.

---

## 6. Padrões e convenções

### 6.1 Naming

- **Arquivos**: kebab-case (`cobrancas.routes.ts`, `boleto.gerador.ts`).
- **Símbolos exportados**: PascalCase para classes/types/interfaces, camelCase
  para funções/variáveis, sempre em pt-BR.
- **Endpoints**: kebab-case em pt-BR (`/admin/regua-cobranca`,
  `/cliente/notificacoes/marcar-todas-lidas`).
- **Query params**: camelCase em pt-BR (`?porPagina=20&pagina=2`).

### 6.2 Estrutura de resposta

**Sucesso simples**:

```json
{ "id": "uuid", "razaoSocial": "Mercado Central LTDA", "...": "..." }
```

**Listagem paginada**:

```json
{
  "itens": [{ "...": "..." }],
  "total": 142,
  "pagina": 1,
  "porPagina": 20
}
```

**Erros (sempre)**:

```json
{
  "erro": "CONFLITO_CNPJ",
  "mensagem": "Já existe um cliente cadastrado com este CNPJ.",
  "detalhes": { "cnpj": "11444777000161" }
}
```

| HTTP | Quando usar                                                      |
| ---- | ---------------------------------------------------------------- |
| 200  | GET / PATCH / PUT bem-sucedido                                   |
| 201  | POST que cria recurso (retornar Location se aplicável)           |
| 204  | DELETE ou ações sem corpo                                        |
| 400  | Erro de validação Zod (formato preservado pelo error handler)    |
| 401  | Sem token / token inválido                                       |
| 403  | Token válido mas perfil não permitido                            |
| 404  | Recurso não encontrado                                           |
| 409  | Conflito de regra de negócio (CNPJ duplicado, fatura já paga)    |
| 422  | Regra de negócio violada (ex: tentar baixar fatura cancelada)    |
| 500  | Erro interno (logar + retornar mensagem genérica)                |

### 6.3 Erros de domínio

Classes em `src/shared/erros/` que estendem `ErroDeDominio` e carregam
`statusCode` e `codigo`. O `errorHandler` central converte para JSON:

```ts
export class ErroDeDominio extends Error {
  constructor(
    public codigo: string,
    mensagem: string,
    public statusCode: number = 400,
    public detalhes?: Record<string, unknown>,
  ) { super(mensagem); }
}

export class NaoEncontrado extends ErroDeDominio {
  constructor(recurso: string, id?: string) {
    super('NAO_ENCONTRADO', `${recurso} não encontrado.`, 404, { id });
  }
}
// + Conflito, NaoAutorizado, Proibido, RegraNegocio
```

### 6.4 Validação

- **Sempre** validar via Zod no nível da rota (body, params, query).
- Reutilizar schemas no service quando útil para conversões (`schema.parse`).
- O `fastify-type-provider-zod` cuida da inferência de tipos no
  `request.body`, `request.params`, `request.query`.

### 6.5 Datas e moedas

- Datas trafegadas como **ISO 8601 UTC** (`2026-05-12T03:00:00.000Z`).
- Valores em **centavos** (Int). Converter para Decimal/reais apenas em
  representações específicas (ex: cálculo de percentuais com `Decimal.js`
  caso necessário). O frontend faz a divisão por 100 na exibição.

### 6.6 Logs

- Pino padrão do Fastify; nível `info` em prod.
- **Nunca** logar senhas, hashes, tokens JWT inteiros (apenas primeiros 8
  chars), nem dados de cartão completos.

### 6.7 Idempotência

- Endpoints destrutivos (cancelar fatura, baixar manual) devem ser idempotentes:
  rodar 2x não duplica efeito. Validações no service garantem isso (ex:
  rejeitar baixa em fatura já PAGO retornando 422).

---

## 7. Autenticação e autorização

### 7.1 Estratégia

- **JWT** assinado com `JWT_SECRET`, expira em `JWT_EXPIRES_IN`.
- **Cookie httpOnly** chamado `df_session` — secure em produção, sameSite
  `lax` para permitir navegação entre subdomínios da mesma origem.
- O token também é devolvido no body de `/auth/login` para clientes que
  preferirem usar `Authorization: Bearer ...` (apps mobile no futuro).
- Todas as rotas protegidas leem o token primeiro do cookie, depois do
  header.

### 7.2 Payload do JWT

```ts
interface SessaoToken {
  sub: string;             // usuarioId ou clienteId
  tipo: 'ADMIN' | 'CLIENTE';
  perfil?: 'ADMIN' | 'FINANCEIRO'; // só quando tipo === 'ADMIN'
  iat: number;
  exp: number;
}
```

### 7.3 Plugin de auth

`src/plugins/auth.plugin.ts` deve:

1. Registrar `@fastify/cookie` e `@fastify/jwt` (lendo de cookies).
2. Decorar `app.requerAdmin` e `app.requerCliente` como `preHandler`s.
3. Decorar `request.sessao` com o payload tipado.
4. Decorar `app.requerPerfilAdmin` (apenas ADMIN, não FINANCEIRO) para
   operações sensíveis (ex: gerenciar usuários internos).

```ts
app.decorate('requerAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
  await req.jwtVerify();
  if (req.sessao.tipo !== 'ADMIN') throw new Proibido();
});
app.decorate('requerCliente', async (req, reply) => {
  await req.jwtVerify();
  if (req.sessao.tipo !== 'CLIENTE') throw new Proibido();
});
```

### 7.4 Senhas

- Hash via bcrypt com `BCRYPT_ROUNDS` configurável.
- Função `hashearSenha(plain)` e `validarSenha(plain, hash)` em
  `shared/utils/senha.ts`.
- **Política mínima** em produção: 8 chars, 1 letra + 1 número. Em dev/teste:
  4 chars (alinhado ao mock atual `df2026`).

### 7.5 Atualização de `ultimoAcesso`

A cada login bem-sucedido de admin, atualizar `usuarios.ultimo_acesso`. Para
cliente, atualizar `clientes.ultimo_acesso` (campo a adicionar se desejado —
**não está no schema atual**, decidir antes de implementar).

---

## 8. Documentação automática (Swagger)

### 8.1 Setup

```ts
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'DF Pagamentos API',
      description: 'Backend do sistema de gestão de pagamentos da Distribuidora Farias.',
      version: '1.0.0',
    },
    servers: [{ url: 'http://localhost:3333', description: 'Local' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'df_session' },
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  transform: jsonSchemaTransform,
});

await app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list', deepLinking: false },
});
```

### 8.2 Anotações por rota

Cada rota declara `schema` com `tags`, `summary`, `body`, `params`, `querystring`,
`response`. O `fastify-type-provider-zod` converte os schemas Zod em JSON
Schema automaticamente.

```ts
app.withTypeProvider<ZodTypeProvider>().get('/admin/clientes/:id', {
  preHandler: [app.requerAdmin],
  schema: {
    tags: ['Clientes'],
    summary: 'Obtém um cliente pelo ID',
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    params: z.object({ id: z.string().uuid() }),
    response: {
      200: clienteSchema,
      404: erroSchema,
    },
  },
}, async (req) => clientesService.obter(req.params.id));
```

---

## 9. Endpoints por módulo

> **Convenções rápidas**: rotas marcadas `🔓` são públicas, `🛡️ Admin` exigem
> sessão admin (qualquer perfil), `🔐 ADMIN-only` exigem perfil ADMIN, `👤 Cliente`
> exigem sessão cliente. **Todos os endpoints** retornam JSON e respeitam o
> formato de erro definido em §6.

### 9.1 Auth

| Método | Path                      | Auth | Descrição                                                      |
| ------ | ------------------------- | ---- | -------------------------------------------------------------- |
| POST   | `/auth/login/admin`       | 🔓    | `{ email, senha }` → seta cookie + retorna `{ usuario, token }` |
| POST   | `/auth/login/cliente`     | 🔓    | `{ cnpj, senha }` → seta cookie + retorna `{ cliente, token }`  |
| POST   | `/auth/logout`            | qualquer | Limpa cookie. 204                                            |
| GET    | `/auth/eu`                | qualquer | Retorna usuário OU cliente da sessão                         |
| POST   | `/auth/cliente/definir-senha` | 🔓 (token de convite) | Define senha no primeiro acesso          |

**Regras**:

- Senha errada: 401 com `{ erro: 'CREDENCIAIS_INVALIDAS' }`.
- Cliente INATIVO: 403 `{ erro: 'CLIENTE_INATIVO' }`.
- Cliente BLOQUEADO: 403 `{ erro: 'CLIENTE_BLOQUEADO' }`.
- Usuário admin inativo: 403 `{ erro: 'USUARIO_INATIVO' }`.

### 9.2 Usuários (`🔐 ADMIN-only`)

| Método | Path                            | Descrição                            |
| ------ | ------------------------------- | ------------------------------------ |
| GET    | `/admin/usuarios`               | Lista com `?busca&perfil&ativo`      |
| GET    | `/admin/usuarios/:id`           | Detalhe                              |
| POST   | `/admin/usuarios`               | Cria (envia email com convite mock)  |
| PUT    | `/admin/usuarios/:id`           | Atualiza nome/email/perfil/ativo     |
| PATCH  | `/admin/usuarios/:id/ativo`     | Toggle ativo                         |

**Regras**:

- Email único (case-insensitive). Conflito → 409.
- Não permitir auto-rebaixamento: o usuário logado **não** pode mudar seu
  próprio `perfil` ou desativar a si mesmo.
- Senha NUNCA retornada nas respostas.

### 9.3 Clientes (`🛡️ Admin`)

| Método | Path                              | Descrição                                |
| ------ | --------------------------------- | ---------------------------------------- |
| GET    | `/admin/clientes`                 | Lista com `?busca&status`                |
| GET    | `/admin/clientes/:id`             | Detalhe                                  |
| POST   | `/admin/clientes`                 | Cria                                     |
| PUT    | `/admin/clientes/:id`             | Atualiza (CNPJ imutável)                 |
| PATCH  | `/admin/clientes/:id/status`      | Body `{ status: ATIVO\|INATIVO\|BLOQUEADO }` |

**Regras**:

- CNPJ único (apenas dígitos no banco). Inválido → 400; duplicado → 409.
- Validar CNPJ via algoritmo módulo 11 (porta do helper `cnpj.ts` do front).

### 9.4 Pedidos (`🛡️ Admin`)

| Método | Path                                   | Descrição                              |
| ------ | -------------------------------------- | -------------------------------------- |
| GET    | `/admin/pedidos`                       | Lista com `?clienteId&status&busca`    |
| GET    | `/admin/pedidos/:id`                   | Detalhe (com itens)                    |
| GET    | `/admin/pedidos/faturaveis`            | Apenas ABERTO ou FATURADO              |

**Regras**:

- Read-only via API. Sincronização do ERP fica para um worker futuro
  (interface `IPedidosErpAdapter`). Por ora, popular via seed e CRUD interno.

### 9.5 Cobranças / Faturas

#### Lado Admin (`🛡️ Admin`)

| Método | Path                                          | Descrição                                                |
| ------ | --------------------------------------------- | -------------------------------------------------------- |
| GET    | `/admin/cobrancas`                            | Lista `?busca&status&clienteId&porPagina&pagina`         |
| GET    | `/admin/cobrancas/:id`                        | Detalhe                                                  |
| POST   | `/admin/cobrancas`                            | Cria fatura (gera BOLETO + PIX)                          |
| POST   | `/admin/cobrancas/:id/baixa-manual`           | `{ dataPagamento, metodoPago, observacoes? }`            |
| POST   | `/admin/cobrancas/:id/cancelar`               | `{ motivo }` — cancelamento Febraban                     |

**Regras de criação**:

- Exige `pedidoId` válido. `clienteId` deduzido do pedido.
- Valor padrão = `pedido.valorTotal`, mas pode ser sobrescrito.
- Configurações de cobrança preenchidas (banco completo + chave PIX). Senão →
  422 `CONFIGURACAO_INCOMPLETA`.
- Gera Boleto via `IBoletoGerador` (consome `bancoProximoNossoNumero` e
  incrementa).
- Gera PIX via `IPixGerador` (usa `pixChave` + dados do beneficiário).
- `numero` é sequencial mensal (`FAT-AAAA-NNNN`).

**Regras de baixa manual**:

- Status precisa ser PENDENTE ou VENCIDO; senão 422.
- Marca status = PAGO, `valorPago` = `valor`, salva `pagamentoMetodo`,
  `dataPagamento`.

**Regras de cancelamento**:

- Status precisa ser PENDENTE ou VENCIDO.
- Atualiza status = CANCELADO, salva `motivoCancelamento` + `canceladoEm`.
- Em produção: chamar API Febraban (interface `IGatewayBoleto.cancelar`).

#### Lado Cliente (`👤 Cliente`)

| Método | Path                                          | Descrição                                          |
| ------ | --------------------------------------------- | -------------------------------------------------- |
| GET    | `/cliente/faturas`                            | Lista `?status` — restrito ao próprio CNPJ         |
| GET    | `/cliente/faturas/:id`                        | Detalhe (apenas se for do cliente)                 |
| POST   | `/cliente/faturas/:id/pagar-com-cartao`       | `{ numero, nomeImpresso, validade, cvv, parcelas }`|

**Regras de pagamento por cartão**:

- Valida número via Luhn no service.
- Detecta bandeira por prefixo (mesma lógica do front: `cartao.ts`).
- Em mock: aceita qualquer cartão Luhn-válido com validade futura.
- Em produção: chama gateway via `IGatewayCartao.cobrar`.
- **Nunca** persistir `numero`, `cvv`, `nomeImpresso` completos. Apenas
  `bandeira`, `ultimosDigitos`, `parcelas`, `authorizationId` no registro
  da fatura.

### 9.6 Inadimplência (`🛡️ Admin`)

| Método | Path                                  | Descrição                                       |
| ------ | ------------------------------------- | ----------------------------------------------- |
| GET    | `/admin/inadimplencia/resumo`         | KPIs + faixas de aging                          |
| GET    | `/admin/inadimplencia/clientes`       | Lista de clientes com pendências agrupadas      |

Faixas de aging (mesmas do frontend): `A_VENCER_7D`, `ATRASO_1_15`,
`ATRASO_16_30`, `ATRASO_31_60`, `ATRASO_60_MAIS`.

Implementação preferencial: **uma única query SQL agregada** usando
`CASE WHEN` para classificar e somar valores.

### 9.7 Fluxo de caixa (`🛡️ Admin`)

| Método | Path                              | Descrição                                                           |
| ------ | --------------------------------- | ------------------------------------------------------------------- |
| GET    | `/admin/fluxo-caixa?mes=YYYY-MM` | Movimentações diárias + KPIs do mês solicitado                      |

Resposta com `totalRecebido`, `totalPendente`, `totalVencido`, `ticketMedio`,
`movimentacoesDiarias[]`, `resumoPorMetodo[]`, `ultimasMovimentacoes[]`,
`variacaoMesAnterior`.

### 9.8 Régua de cobrança (`🛡️ Admin`)

| Método | Path                                  | Descrição                              |
| ------ | ------------------------------------- | -------------------------------------- |
| GET    | `/admin/regras`                       | Lista todas (ordenadas por `diasOffset`)|
| POST   | `/admin/regras`                       | Cria com `acoes[]`                     |
| PUT    | `/admin/regras/:id`                   | Atualiza (substitui `acoes[]`)         |
| PATCH  | `/admin/regras/:id/ativo`             | Toggle ativo                           |
| DELETE | `/admin/regras/:id`                   | Exclui (cascata em `acoes_regua`)      |

Validação de coerência: `gatilho` × `diasOffset` (mesmo refine do frontend).

### 9.9 Notificações

#### Cliente (`👤 Cliente`)

| Método | Path                                            | Descrição                              |
| ------ | ----------------------------------------------- | -------------------------------------- |
| GET    | `/cliente/notificacoes`                         | Lista das notificações do cliente      |
| POST   | `/cliente/notificacoes/:id/marcar-lida`         | Marca uma como lida                    |
| POST   | `/cliente/notificacoes/marcar-todas-lidas`      | Marca todas como lidas                 |

#### Admin (`🛡️ Admin`)

| Método | Path                                  | Descrição                                  |
| ------ | ------------------------------------- | ------------------------------------------ |
| GET    | `/admin/notificacoes`                 | Audit trail (todas) com `?clienteId&canal` |
| POST   | `/admin/notificacoes/disparar-regua`  | Roda a régua sob demanda (ignorando cron)  |

### 9.10 Produtos (`🛡️ Admin`)

| Método | Path                              | Descrição                                  |
| ------ | --------------------------------- | ------------------------------------------ |
| GET    | `/admin/produtos`                 | Lista `?busca&ativo`                       |

Read-only. Mesmo princípio de pedidos: integração via worker futuro.

### 9.11 Configurações (`🛡️ Admin`)

| Método | Path                              | Descrição                                            |
| ------ | --------------------------------- | ---------------------------------------------------- |
| GET    | `/admin/configuracoes`            | Retorna o singleton                                  |
| PUT    | `/admin/configuracoes`            | Atualiza tudo                                        |

### 9.12 Dashboard cliente (`👤 Cliente`)

| Método | Path                              | Descrição                                            |
| ------ | --------------------------------- | ---------------------------------------------------- |
| GET    | `/cliente/dashboard`              | Resumo: total gasto, em aberto, vencido, qtdAberto, próximas |

---

## 10. Geração de Boleto e PIX

### 10.1 Interfaces

```ts
// src/modules/cobrancas/boleto.gerador.ts
export interface IBoletoGerador {
  gerar(input: {
    valor: number;
    dataVencimento: Date;
    nossoNumero: string;
    config: ConfiguracoesCobranca;
  }): Promise<{
    linhaDigitavel: string;
    codigoBarras: string;
    nossoNumero: string;
    urlPdf?: string;
  }>;
}
```

```ts
// src/modules/cobrancas/pix.gerador.ts
export interface IPixGerador {
  gerar(input: {
    valor: number;
    config: ConfiguracoesCobranca;
  }): Promise<{
    copiaECola: string;
    qrCode: string;       // URL ou base64 PNG/SVG
    txid: string;
    expiraEm?: Date;
  }>;
}
```

### 10.2 Implementação inicial (mock)

Replica a lógica do frontend (`cobrancas.mock.ts`) no servidor. Sequência
determinística baseada em `valor + vencimento + nossoNumero`. **Importa o
mesmo algoritmo** para que dev local consiga reproduzir os exemplos atuais.

### 10.3 Substituição em produção

Implementações reais (a serem injetadas via container DI ou factory):

- `BoletoFebrabanGerador` (banco real — Itaú/Bradesco/etc).
- `PixDinamicoGerador` (PSP — Sicredi/Inter/etc).

Configuração via env (`PROVEDOR_BOLETO=mock|itau|bradesco`).

---

## 11. Régua de cobrança e notificações

### 11.1 Worker de execução

`src/modules/notificacoes/regua.worker.ts` — agendado por `node-cron` com
`REGUA_CRON` (default: 09:00 todos os dias).

Algoritmo:

1. Buscar `regrasAtivas = RegraCobranca.findMany({ ativo: true })`.
2. Para cada regra, calcular a janela de vencimento alvo:
   - `gatilho = ANTES_VENCIMENTO`, `diasOffset = -3` →
     `alvo = hoje + 3` (vencimentos `3 dias no futuro`).
   - `gatilho = DIA_VENCIMENTO` → `alvo = hoje`.
   - `gatilho = APOS_VENCIMENTO`, `diasOffset = 3` → `alvo = hoje - 3`.
3. Buscar faturas com `dataVencimento` no dia `alvo` e status PENDENTE/VENCIDO.
4. Para cada fatura × cada `acao` da regra:
   - Renderizar template (substituir `{{cliente}}`, `{{numero}}`, `{{valor}}`,
     `{{vencimento}}`, `{{linha}}`, `{{pix}}`).
   - Chamar canal correspondente (`ICanalNotificacao.enviar`).
   - Persistir registro em `notificacoes` (com `enviadaEm` ou `erro`).

### 11.2 Canais

```ts
// src/modules/notificacoes/canais/canal.interface.ts
export interface ICanalNotificacao {
  enviar(input: {
    destinatario: string;        // email, telefone E.164...
    assunto?: string;
    mensagem: string;
  }): Promise<{ enviadoEm: Date }>;
}
```

Implementações iniciais:

- `EmailCanalLog` (apenas `console.log` + persiste registro). Substituir por
  SES/Sendgrid em prod.
- `WhatsAppCanalLog`, `SmsCanalLog`.

### 11.3 Endpoint manual

`POST /admin/notificacoes/disparar-regua` permite rodar o worker sob demanda
(útil para testes em ambiente de produção sem esperar o cron). Deve aceitar
`{ regraId? }` para disparar uma regra específica.

### 11.4 Notificações reativas (sem regra)

Além das notificações da régua, o backend também cria automaticamente entradas
em `notificacoes` em momentos-chave:

- Cliente paga via cartão → `titulo: 'Pagamento confirmado'`.
- Fatura cancelada → `titulo: 'Fatura cancelada'`.
- Fatura passa a VENCIDO no recálculo diário → `titulo: 'Fatura em atraso'`.

Essas são exibidas no portal mesmo sem regra de cobrança ativa.

---

## 12. Estratégia de testes (Jest)

### 12.1 Tipos de teste

| Tipo            | Onde                              | O que cobre                                                |
| --------------- | --------------------------------- | ---------------------------------------------------------- |
| Unit            | `tests/modules/<x>/*.test.ts`     | Funções puras (CNPJ, Luhn, geradores Boleto/PIX, helpers)  |
| Integração      | `tests/modules/<x>/*.routes.test.ts` | Rotas HTTP completas com banco real de teste            |
| Smoke E2E       | `tests/smoke/`                    | Fluxos críticos (login → criar cobrança → pagar → notificar) |

### 12.2 Banco de testes

- Postgres em container separado (`docker-compose.yml` → serviço `postgres-test`).
- `.env.test` com `DATABASE_URL` distinto.
- `tests/setup.ts` roda `prisma migrate deploy` antes de tudo.
- `helpers/limpar-banco.ts` faz `TRUNCATE ... RESTART IDENTITY CASCADE` entre
  testes (não usar transações com rollback porque algumas operações são
  sensíveis a transação aberta — evitar surpresas).

### 12.3 Helpers e factories

```ts
// tests/helpers/build-app.ts
export async function construirApp() {
  const app = await criarApp();          // mesma factory de produção
  await app.ready();
  return app;
}

// tests/helpers/factories/cliente.factory.ts
export async function criarClienteSeed(overrides = {}) {
  return prisma.cliente.create({ data: { /* defaults */, ...overrides } });
}
```

### 12.4 Cobertura mínima por módulo

| Módulo           | Cobertura mínima esperada                                    |
| ---------------- | ------------------------------------------------------------ |
| auth             | 90% — fluxo de login admin/cliente, falhas, expiração JWT     |
| clientes         | 85% — CRUD + validação de CNPJ + casos de borda              |
| cobrancas        | 85% — geração, baixa, cancelamento, pagamento por cartão     |
| inadimplencia    | 75% — testes da query agregada com fixtures variadas         |
| regras           | 80% — CRUD + validação cruzada gatilho×offset                |
| notificações     | 75% — disparo da régua + canais mockados                     |

### 12.5 Configuração `jest.config.ts`

```ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEach: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testTimeout: 30_000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.routes.ts', // a cobertura vem dos integration tests
    '!src/server.ts',
  ],
};
```

### 12.6 Mocks

- Prisma: **não** mockar — usar banco real de teste é mais confiável e
  detecta problemas de migrations.
- Canais de notificação (`EmailCanal`, `WhatsAppCanal`, `SmsCanal`): mockar
  via DI substituindo por `JestSpyCanal` que captura envios em memória.
- Geradores de Boleto/PIX: usar a impl mock determinística mesmo nos testes
  (snapshots estáveis).

---

## 13. Plano de implementação por fases

Cada fase termina com testes passando, lint limpo e migrations aplicadas.
**Não pular fases.**

### Fase 1 — Foundation

1. `npm init`, instalar dependências, configurar tsconfig strict.
2. ESLint + Prettier (replicar regras do frontend onde fizer sentido).
3. `docker-compose.yml` com Postgres dev/test.
4. `src/env.ts` validando env via Zod.
5. `src/app.ts` criando Fastify, registrando plugins essenciais (cors,
   sensible, swagger, errorHandler).
6. Healthcheck `GET /saude` retornando `{ status: 'ok' }`.
7. Setup Jest + 1 teste de fumaça do healthcheck.

### Fase 2 — Banco e Auth

1. `prisma init`, escrever `schema.prisma` completo.
2. Criar primeira migration.
3. Implementar `seed.ts`.
4. Plugin Prisma (decorate `app.prisma`).
5. Módulo `usuarios` (apenas CRUD interno + service de hash).
6. Módulo `auth` com login admin + cliente, cookie httpOnly, JWT.
7. Plugin auth (`requerAdmin` / `requerCliente`).
8. Tests: login bem-sucedido, senha errada, cliente bloqueado, expiração JWT.

### Fase 3 — Clientes, Configurações, Produtos

1. CRUD de clientes com validação de CNPJ.
2. Singleton de `configuracoes_cobranca`: GET + PUT.
3. Read-only de produtos (com seed + endpoint de listagem).
4. Tests integração para cada um.

### Fase 4 — Pedidos e Cobranças

1. Read-only de pedidos.
2. Geradores de Boleto e PIX (impl mock determinística).
3. Endpoint POST `/admin/cobrancas` consumindo configurações.
4. Endpoint baixa manual + cancelar.
5. Endpoint cliente: pagar com cartão (validação Luhn + bandeira).
6. Tests: criar cobrança sem configurações → 422; pagar fatura cancelada → 422;
   Luhn inválido → 400.

### Fase 5 — Inadimplência e Fluxo de caixa

1. Query agregada de aging buckets (testar com fixtures).
2. Endpoint resumo + endpoint clientes em atraso.
3. Endpoint fluxo de caixa por mês.
4. Tests com calendário fixo (mockar `new Date()` via `jest.useFakeTimers`).

### Fase 6 — Régua e Notificações

1. CRUD de regras.
2. Validação cruzada gatilho × offset.
3. Worker da régua (manual + cron).
4. Canais (Email/WhatsApp/SMS log only).
5. Endpoints cliente: listar + marcar lida.
6. Tests: regra ANTES_VENCIMENTO -3 com fatura vencendo em 3d → dispara;
   regra inativa → não dispara.

### Fase 7 — Polish

1. Rate limiting com `@fastify/rate-limit` em rotas de login.
2. Helmet com `@fastify/helmet`.
3. CORS com `@fastify/cors` lendo `CORS_ORIGIN`.
4. Logs estruturados (request-id + cliente/usuario id).
5. Coverage gate: CI rejeita PR com coverage < limites do §12.4.

### Fase 8 — Documentação e DX

1. Swagger UI completo em `/docs`.
2. README com instruções de setup local (docker, migrations, seed, dev).
3. `Makefile` ou `npm` scripts cobrindo casos de uso comuns.

---

## 14. Anexos: trechos de código

### 14.1 `src/server.ts`

```ts
import { criarApp } from './app';
import { env } from './env';

async function main() {
  const app = await criarApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`API rodando em http://localhost:${env.PORT}`);
  app.log.info(`Docs em http://localhost:${env.PORT}/docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 14.2 `src/app.ts`

```ts
import Fastify from 'fastify';
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import { prismaPlugin } from './plugins/prisma.plugin';
import { authPlugin } from './plugins/auth.plugin';
import { swaggerPlugin } from './plugins/swagger.plugin';
import { errorHandlerPlugin } from './plugins/error-handler.plugin';
import { rotasAuth } from './modules/auth/auth.routes';
import { rotasClientes } from './modules/clientes/clientes.routes';
// ... demais módulos

export async function criarApp() {
  const app = Fastify({ logger: { level: env.LOG_LEVEL } }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandlerPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(swaggerPlugin);

  app.get('/saude', { schema: { tags: ['Sistema'], summary: 'Healthcheck' } }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(rotasAuth, { prefix: '/auth' });
  await app.register(rotasClientes, { prefix: '/admin/clientes' });
  // ... demais módulos

  return app;
}
```

### 14.3 Plugin de erro centralizado

```ts
// src/plugins/error-handler.plugin.ts
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import { ErroDeDominio } from '../shared/erros/erro-dominio';

export const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        erro: 'VALIDACAO',
        mensagem: 'Dados inválidos.',
        detalhes: err.flatten().fieldErrors,
      });
    }
    if (err instanceof ErroDeDominio) {
      return reply.status(err.statusCode).send({
        erro: err.codigo,
        mensagem: err.message,
        detalhes: err.detalhes,
      });
    }
    app.log.error(err);
    return reply.status(500).send({
      erro: 'INTERNO',
      mensagem: 'Erro interno do servidor.',
    });
  });
});
```

### 14.4 Exemplo de rota com Zod

```ts
// src/modules/clientes/clientes.routes.ts
import { z } from 'zod';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { FastifyInstance } from 'fastify';

const clienteSchema = z.object({
  id: z.string().uuid(),
  cnpj: z.string(),
  razaoSocial: z.string(),
  // ...
});

export async function rotasClientes(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();

  a.get('/', {
    preHandler: [app.requerAdmin],
    schema: {
      tags: ['Clientes'],
      summary: 'Lista clientes',
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      querystring: z.object({
        busca: z.string().optional(),
        status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']).optional(),
      }),
      response: { 200: z.object({ itens: z.array(clienteSchema) }) },
    },
  }, async (req) => {
    const itens = await req.server.prisma.cliente.findMany({
      where: { /* ... */ },
    });
    return { itens };
  });

  // POST, PUT, PATCH ...
}
```

### 14.5 Exemplo de teste de integração

```ts
// tests/modules/auth.test.ts
import { construirApp } from '../helpers/build-app';
import { limparBanco } from '../helpers/limpar-banco';
import { criarUsuarioSeed } from '../helpers/factories/usuario.factory';

describe('POST /auth/login/admin', () => {
  let app: Awaited<ReturnType<typeof construirApp>>;

  beforeAll(async () => { app = await construirApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => { await limparBanco(); });

  it('autentica usuário admin e devolve cookie + token', async () => {
    await criarUsuarioSeed({ email: 'aluciney@df.com', senha: 'df2026' });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/login/admin',
      payload: { email: 'aluciney@df.com', senha: 'df2026' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      usuario: { email: 'aluciney@df.com' },
      token: expect.any(String),
    });
    expect(res.cookies.find((c) => c.name === 'df_session')).toBeDefined();
  });

  it('rejeita senha incorreta', async () => {
    await criarUsuarioSeed({ email: 'a@b.com', senha: 'df2026' });
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login/admin',
      payload: { email: 'a@b.com', senha: 'errada' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().erro).toBe('CREDENCIAIS_INVALIDAS');
  });
});
```

---

## Decisões abertas (a confirmar no kickoff)

1. **Multi-tenant?** Atual schema é single-tenant (uma Distribuidora Farias).
   Caso futuro precise comportar múltiplas distribuidoras, todas as tabelas
   precisam ganhar `organizacao_id`. **Recomendação**: adiar até demanda real.
2. **Eventos / mensageria?** Não há broker atualmente. Para integração com
   ERP em tempo real ou auditoria robusta, considerar Kafka/RabbitMQ. **Por
   ora**: jobs cron + chamadas síncronas bastam.
3. **Backups e disaster recovery**: definir política antes de produção (RPO/RTO).
4. **Observabilidade**: integrar OpenTelemetry para traces distribuídos.
   Pino em JSON é suficiente para começar.
5. **Política de senhas em produção**: 8+ chars, exigir letra+número, lockout
   após N tentativas. Manter dev/test em `df2026`.
6. **Recuperação de senha** (esqueci minha senha): a tela já existe mas é
   mock. Implementar fluxo de envio de email com token de uso único quando o
   canal de email real estiver disponível.

---

**Última atualização**: 2026-05-05
**Versão**: 1.0
