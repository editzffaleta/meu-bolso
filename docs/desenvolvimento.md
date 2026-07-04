# Guia de desenvolvimento

## Pré-requisitos

- **Node 20+** e **npm**
- **Docker** (para o PostgreSQL local) ou um PostgreSQL acessível

## Setup

```bash
# 1. dependências (raiz do monorepo)
npm install

# 2. variáveis de ambiente
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. subir o banco (Docker) e aplicar as migrations
npm run db:start --workspace @meubolso/backend
npm run prisma:migrate:deploy --workspace @meubolso/backend

# 4. (opcional) popular com dados de demonstração
npm run seed:demo

# 5. subir backend (:4000) + frontend (:3000)
npm run dev
```

Acesse `http://localhost:3000`. Com o seed demo, entre com `demo@meubolso.app` / `demo123456`
(ou o botão "Entrar com conta de demonstração").

## Estrutura do repositório

```
apps/
  backend/    # API NestJS — controllers, guards, repositórios Prisma, migrations
  frontend/   # UI Next.js (App Router)
  e2e/        # testes end-to-end (Playwright) + fixtures
modules/      # domínio puro por bounded context (entidades, casos de uso, ports)
packages/
  shared/     # contratos base, erros de domínio, regras de validação
docs/         # esta documentação
```

## Scripts principais

Na raiz (via Turborepo, roda em todos os workspaces relevantes):

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe backend e frontend em watch |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run check-types` | Typecheck (`tsc --noEmit`) |
| `npm run test` | Testes unitários/integração (Jest) |
| `npm run test:e2e` | Testes end-to-end (Playwright) |
| `npm run seed:demo` | Popula dados de demonstração |

No backend (`--workspace @meubolso/backend`): `db:start`, `db:stop`, `prisma:migrate:dev`,
`prisma:migrate:deploy`, `prisma:studio`.

## Testes

- **Domínio/casos de uso**: Jest com *fakes* em memória (sem banco). Vários módulos com 100% de
  cobertura nos casos de uso e entidades.
- **E2E**: Playwright cobre o fluxo crítico (registro → login → criar conta → importar CSV →
  transações categorizadas → dashboard). Requer o banco de pé; o `webServer` do Playwright sobe
  backend e frontend automaticamente.

```bash
npm run test        # unit/integração
npm run test:e2e    # end-to-end
```

## Convenções

- **Arquitetura**: o domínio (`modules/*`) não importa NestJS nem Prisma; casos de uso recebem
  *ports*. Ver [`arquitetura.md`](arquitetura.md).
- **Isolamento por usuário**: toda query/endpoint escopado por `userId` (do JWT). Nunca aceite
  `userId` vindo do cliente.
- **Novo módulo de domínio**: crie o pacote em `modules/<nome>` (entidade + ports + casos de uso),
  o espelho de infra em `apps/backend/src/modules/<nome>` (controller + repositório Prisma), e
  **declare no `package.json` do módulo os pacotes `@meubolso/*` que ele importa** (senão o build
  em CI quebra por ordem incorreta).
- **Commits**: Conventional Commits em português (`feat:`, `fix:`, `docs:`, `style:`, `test:`,
  `chore:`). Ver [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

## Variáveis de ambiente

**Backend** (`apps/backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`,
`SEED_DEMO_PASSWORD` (para o seed demo). **Frontend** (`apps/frontend/.env`): `NEXT_PUBLIC_API_URL`.
Apenas os `.env.example` são versionados — nunca commite segredos.

## CI

O GitHub Actions (`.github/workflows/ci.yml`) roda, a cada push/PR: instala dependências, **gera o
Prisma Client**, e executa `lint`, `check-types`, `test` e `build`.
