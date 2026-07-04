# Arquitetura

O meu-bolso é um monorepo **Turborepo** com dois apps (backend NestJS, frontend Next.js), pacotes de
domínio independentes e um pacote compartilhado.

## Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│  apps/frontend  (Next.js / App Router)                        │
│  páginas + componentes → fetch autenticado (cookie JWT)       │
└───────────────────────────────┬─────────────────────────────┘
                                 │ HTTP (Bearer JWT)
┌───────────────────────────────▼─────────────────────────────┐
│  apps/backend  (NestJS)  — interface + infraestrutura         │
│  controllers finos · guards JWT · repositórios Prisma         │
└───────────────────────────────┬─────────────────────────────┘
                                 │ usa (ports)
┌───────────────────────────────▼─────────────────────────────┐
│  modules/*  — domínio puro por bounded context                │
│  entidades · casos de uso (UseCase<In,Out>) · ports           │
│  (accounts, categories, transactions, imports, budgets,       │
│   analytics, auth) — não importam NestJS nem Prisma           │
└───────────────────────────────┬─────────────────────────────┘
                                 │
┌───────────────────────────────▼─────────────────────────────┐
│  packages/shared — contratos base, erros, validação            │
└─────────────────────────────────────────────────────────────┘
                                 │
                          PostgreSQL (via Prisma)
```

## Camadas e regra de dependência

Segue **Clean Architecture + DDD**. A dependência aponta sempre para dentro:

`interface/infra (apps/backend)  →  aplicação (casos de uso)  →  domínio (entidades)`

- **Domínio** (`modules/*/src`): entidades ricas (`Entity<State>` com validação), *value objects*,
  e as **ports** (interfaces de repositório e providers). **Não conhece** NestJS, Prisma nem HTTP.
- **Aplicação**: casos de uso `UseCase<In, Out>` que recebem as ports por injeção e orquestram a
  regra de negócio. Testáveis com *fakes* em memória, sem banco.
- **Interface / Infraestrutura** (`apps/backend`): controllers finos que instanciam os casos de uso,
  guards de autenticação, e as implementações Prisma que **satisfazem** as ports.

Consequência prática: para trocar o ORM ou o framework HTTP, o domínio e os casos de uso não mudam.

## Módulos (bounded contexts)

Cada pasta em `modules/` é um pacote npm independente (`@meubolso/<nome>`) que expõe seus tipos via
`dist/`:

| Módulo | Responsabilidade |
|---|---|
| `auth` | Usuário, registro, login (o domínio não conhece token/sessão) |
| `accounts` | Contas/carteiras do usuário |
| `categories` | Categorias + regras de categorização automática |
| `transactions` | Lançamentos financeiros, filtros e paginação |
| `imports` | Importação de extratos CSV/OFX |
| `budgets` | Orçamentos por categoria/mês |
| `analytics` | Agregações somente-leitura para o dashboard |

Cada módulo tem seu espelho de infraestrutura em `apps/backend/src/modules/<nome>`
(controller, module Nest, repositório Prisma).

## Decisões-chave

- **Isolamento por usuário como invariante.** Sem multi-tenancy nem RBAC — modelo multiusuário
  simples. **Toda** query e endpoint é escopado por `userId` (lido do JWT, nunca do cliente), e a
  posse de recursos referenciados (conta/categoria de uma transação) é validada no caso de uso.
  Testado cruzando dois usuários em cada módulo (acesso ao dado alheio → `404`).

- **Autenticação stateless com JWT.** O domínio de `auth` só valida credenciais; a camada HTTP
  assina o JWT `{ sub, name, email }`. O frontend guarda o token em cookie e um *guard* protege as
  rotas privadas.

- **Importação idempotente por *fingerprint*.** Cada lançamento recebe um hash de
  data+valor+descrição usado para deduplicar reimportações. O índice único é **parcial**
  (`WHERE source = 'import'`), então lançamentos manuais idênticos legítimos continuam permitidos.
  Ver [`import.md`](import.md).

- **Categorização desacoplada por *port* estrutural.** Como `transactions` já depende de
  `categories`, evita-se o ciclo inverso: `categories` expõe uma port estrutural
  (`TransactionCategorizationPort`) e o *adapter* concreto vive na infraestrutura. A importação
  chama `apply-rules` ao final.

- **Analytics somente leitura.** O módulo `analytics` não persiste nada — calcula as agregações via
  `aggregate`/`groupBy` do Prisma, sempre escopado por `userId`.

- **Monorepo com build ordenado.** `lint`/`check-types`/`test` dependem do `^build` dos pacotes de
  domínio (que expõem tipos via `dist/`), garantindo a ordem correta a partir de um checkout limpo
  (ver `turbo.json`).

## Fluxo de uma requisição (exemplo: criar transação)

1. Frontend faz `POST /transactions` com o token no header `Authorization`.
2. O guard JWT valida o token e injeta `userId` via `@CurrentUser`.
3. O controller instancia o caso de uso `create-transaction` com o repositório Prisma.
4. O caso de uso valida a entrada, confere que `accountId`/`categoryId` pertencem ao `userId`,
   calcula o *fingerprint* e persiste.
5. Erros de domínio viram `ApiErrorResponse` pelo filtro global.
