# df-api — Backend DF Pagamentos

Backend do sistema de gestão de pagamentos da **Distribuidora Farias**. Stack:
Fastify 5 + TypeScript + Prisma + PostgreSQL 16, com Zod (via
`fastify-type-provider-zod`), Swagger UI em `/docs`, JWT em cookie httpOnly e
régua de cobrança via `node-cron`.

> Especificação completa em [`../BACKEND.md`](../BACKEND.md).

## Pré-requisitos

- Node.js 22+
- Docker (para Postgres dev/test)
- npm

## Setup local

```bash
# 1) Subir Postgres (dev na 5432, test na 5433)
docker compose up -d

# 2) Instalar dependências
npm install

# 3) Configurar .env (a partir do exemplo)
cp .env.example .env
# Edite JWT_SECRET / COOKIE_SECRET para algo > 32 chars

# 4) Gerar client + aplicar migrations + seed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5) Subir API
npm run dev
```

API disponível em `http://localhost:3333` e Swagger em
`http://localhost:3333/docs`.

## Credenciais do seed

Senha padrão (admin e clientes): `df2026`.

| Tipo            | Identificador            | Perfil      |
| --------------- | ------------------------ | ----------- |
| Admin           | aluciney@df.com          | ADMIN       |
| Financeiro      | mariana@df.com           | FINANCEIRO  |
| Cliente (CNPJ)  | 11.444.777/0001-61       | —           |

## Scripts

```bash
npm run dev               # tsx watch
npm run build             # tsup → dist/
npm start                 # roda dist/src/server.js
npm run prisma:generate   # gera client
npm run prisma:migrate    # cria/aplica migration de dev
npm run prisma:deploy     # aplica migrations em prod (CI/CD)
npm run prisma:seed       # popula o banco
npm run prisma:studio     # abre o Studio
npm test                  # jest --runInBand
npm run test:coverage     # jest com cobertura
npm run lint              # biome lint
npm run format            # biome format --write
```

## Estrutura

```
src/
├── app.ts                # composição do Fastify
├── server.ts             # bootstrap (listen + worker da régua)
├── env.ts                # validação Zod das env vars
├── plugins/              # prisma, auth, swagger, error-handler
├── modules/              # feature-based (auth, clientes, cobrancas, ...)
└── shared/               # erros, utils (cnpj, cpf, cartao, moeda, data, senha)
prisma/
├── schema.prisma
└── seed.ts
tests/
├── setup.ts
├── helpers/
└── modules/
```

## Endpoints principais

Todas as rotas estão documentadas em **`/docs`**. Resumo dos prefixos:

- `POST /auth/login/admin`, `POST /auth/login/cliente`, `GET /auth/eu`, `POST /auth/logout`
- `/admin/usuarios` — CRUD (somente perfil ADMIN)
- `/admin/clientes` — CRUD
- `/admin/produtos` — read-only (espelho do ERP)
- `/admin/pedidos` — read-only (com `/faturaveis`)
- `/admin/configuracoes` — singleton de cobrança (GET/PUT)
- `/admin/cobrancas` — CRUD de faturas + baixa-manual + cancelar
- `/admin/inadimplencia/{resumo,clientes}` — KPIs + aging
- `/admin/fluxo-caixa?mes=YYYY-MM`
- `/admin/regras` — régua (CRUD) + `/admin/notificacoes/disparar-regua`
- `/admin/notificacoes` — audit trail
- `/cliente/faturas` + `POST /cliente/faturas/:id/pagar-com-cartao`
- `/cliente/notificacoes` — listar / marcar lida(s)
- `/cliente/dashboard`

## Testes

Os testes de integração usam o Postgres rodando em `localhost:5433`. Antes da
primeira execução, aplique as migrations no banco de teste:

```bash
DATABASE_URL=postgresql://df:df@localhost:5433/df_test?schema=public \
  npx prisma migrate deploy
```

Depois:

```bash
npm test
```

## Notas de implementação

- **Geração de boleto/PIX**: implementação mock determinística em
  `src/modules/cobrancas/{boleto,pix}.gerador.ts`. Para produção, troque por
  uma implementação real do `IBoletoGerador` / `IPixGerador` (e.g. Itaú,
  Sicredi).
- **Régua de cobrança**: `src/modules/notificacoes/regua.worker.ts` é
  agendado por `REGUA_CRON` e lê regras ativas. Canais (`EMAIL`, `WHATSAPP`,
  `SMS`) são por enquanto loggers (`*.canal.ts`).
- **Auth**: JWT em cookie httpOnly + também devolvido no body do login para
  clientes mobile / Bearer.
- **Erros**: domain errors em `src/shared/erros/` (`ErroDeDominio`,
  `NaoEncontrado`, `Conflito`, `Proibido`, `RegraNegocio`,
  `NaoAutorizado`) são convertidos para JSON pelo `error-handler.plugin`.
