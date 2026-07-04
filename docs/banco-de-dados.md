# Modelo de dados

PostgreSQL, gerenciado por **Prisma**. O schema é modular: cada domínio tem seu arquivo em
`apps/backend/prisma/models/*.model.prisma`. Toda tabela de domínio referencia `users` e é sempre
consultada com filtro por `userId`.

## Diagrama (ERD)

```mermaid
erDiagram
  User ||--o{ Account : possui
  User ||--o{ Category : possui
  User ||--o{ Transaction : possui
  User ||--o{ Import : possui
  User ||--o{ CategorizationRule : possui
  User ||--o{ Budget : possui
  Account ||--o{ Transaction : registra
  Account ||--o{ Import : recebe
  Category ||--o{ Transaction : classifica
  Category ||--o{ CategorizationRule : alvo
  Category ||--o{ Budget : limita

  User { string id PK; string name; string email UK; string password }
  Account { string id PK; string name; string type; string institution; decimal initialBalance; string userId FK }
  Category { string id PK; string name; string type; string color; string icon; bool isDefault; string userId FK }
  Transaction { string id PK; datetime date; string description; string type; decimal amount; string accountId FK; string categoryId FK; string source; string fingerprint; string userId FK }
  Import { string id PK; string fileName; string format; string status; string accountId FK; int totalRows; int importedRows; int duplicateRows; string userId FK }
  CategorizationRule { string id PK; string keyword; int priority; string categoryId FK; string userId FK }
  Budget { string id PK; string categoryId FK; string month; decimal limitAmount; string userId FK }
```

## Entidades

### `users`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `name` | string | |
| `email` | string | **único** |
| `password` | string | hash bcrypt |
| `createdAt`/`updatedAt`/`deletedAt` | datetime | soft delete opcional |

### `accounts`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `name` | string | |
| `type` | string | `checking` \| `savings` \| `wallet` \| `credit` |
| `institution` | string? | opcional |
| `initialBalance` | decimal(14,2) | default `0` |
| `userId` | uuid | FK → users (cascade) · indexado |

### `categories`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `name` | string | |
| `type` | string | `expense` \| `income` |
| `color` | string | hex |
| `icon` | string? | opcional |
| `isDefault` | bool | default `false` (categorias semeadas) |
| `userId` | uuid | FK → users (cascade) · indexado |

### `transactions`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `date` | datetime | indexado com `userId` |
| `description` | string | |
| `type` | string | `income` \| `expense` |
| `amount` | decimal(14,2) | valor positivo |
| `accountId` | uuid | FK → accounts |
| `categoryId` | uuid? | FK → categories (opcional) |
| `source` | string | `manual` \| `import` (default `manual`) |
| `importId` | uuid? | referência à importação de origem |
| `fingerprint` | string | dedup — hash de data+valor+descrição |
| `userId` | uuid | FK → users (cascade) |

> Índice único **parcial** em `(userId, fingerprint) WHERE source = 'import'` — a deduplicação vale
> só para transações importadas; lançamentos manuais idênticos são permitidos.

### `imports`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `fileName` | string | |
| `format` | string | `csv` \| `ofx` |
| `status` | string | `processing` \| `done` \| `failed` |
| `accountId` | uuid | FK → accounts |
| `totalRows`/`importedRows`/`duplicateRows` | int | contadores do resultado |
| `userId` | uuid | FK → users (cascade) |

### `categorization_rules`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `keyword` | string | casa (case-insensitive) na descrição |
| `priority` | int | default `0` (menor = maior prioridade) |
| `categoryId` | uuid | FK → categories |
| `userId` | uuid | FK → users (cascade) · indexado com `priority` |

### `budgets`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `categoryId` | uuid | FK → categories |
| `month` | string | `YYYY-MM` |
| `limitAmount` | decimal(14,2) | > 0 |
| `userId` | uuid | FK → users (cascade) |

> Único por `(userId, categoryId, month)`.

## Migrations

As migrations ficam em `apps/backend/prisma/migrations/`. Comandos úteis:

```bash
npm run prisma:migrate:dev --workspace @meubolso/backend      # criar/aplicar em dev
npm run prisma:migrate:deploy --workspace @meubolso/backend   # aplicar em produção/CI
npm run prisma:studio --workspace @meubolso/backend           # inspecionar os dados
```
