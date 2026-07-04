# Referência da API

API REST do **meu-bolso**, servida pelo backend NestJS em `http://localhost:4000` (base configurável
via `NEXT_PUBLIC_API_URL` no frontend).

## Autenticação

- A API usa **JWT stateless**. Faça `POST /auth/login` e use o token retornado no header
  `Authorization: Bearer <token>` nas rotas protegidas.
- O `userId` é sempre extraído do token — **nunca** é aceito no corpo ou na query. Todo recurso é
  automaticamente escopado ao usuário autenticado.
- Rotas públicas: `POST /auth/register` e `POST /auth/login`. Todas as demais exigem token válido
  (respondem `401` sem ele).

## Formato de erro

Todas as respostas de erro seguem o contrato `ApiErrorResponse`:

```json
{ "statusCode": 422, "errors": ["user.password.strong.password", "user.email.email"] }
```

- `errors` é uma **lista de códigos** de mensagem (i18n). O frontend traduz cada código e mostra um
  toast por item. Códigos comuns: validação (`422`), não encontrado (`404`), conflito (`409`),
  não autenticado (`401`).

## Convenções

- Corpo e respostas em **JSON** (exceto o upload de importação, que é `multipart/form-data`).
- Valores monetários são números decimais (ex.: `1500.50`).
- Datas em ISO 8601 (`2026-07-04` ou `2026-07-04T12:00:00.000Z`). Mês em `YYYY-MM`.

---

## Auth — `/auth`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/register` | pública | Cria um usuário |
| `POST` | `/auth/login` | pública | Autentica e retorna o JWT |

**`POST /auth/register`** — corpo `{ name, email, password }` → `201` sem corpo.
Erros: `409` e-mail já cadastrado (`user.email.already.registered`); `422` validação (nome, e-mail,
senha fraca/comum).

**`POST /auth/login`** — corpo `{ email, password }` → `200 { token, user: { id, name, email } }`.
Erros: `401` credenciais inválidas (`user.credentials.invalid`).

---

## Contas — `/accounts`

CRUD de contas do usuário. Todas exigem autenticação.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/accounts` | Cria conta |
| `GET` | `/accounts` | Lista as contas do usuário |
| `GET` | `/accounts/:id` | Detalha uma conta |
| `PATCH` | `/accounts/:id` | Atualiza uma conta |
| `DELETE` | `/accounts/:id` | Remove uma conta |

Corpo de criação/edição: `{ name, type, institution?, initialBalance }`
- `type`: `checking` | `savings` | `wallet` | `credit`
- `initialBalance`: número (default `0`)

Erros: `404` conta inexistente ou de outro usuário (`account.not.found`); `422` validação.

---

## Categorias — `/categories`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/categories` | Cria categoria |
| `GET` | `/categories` | Lista categorias do usuário |
| `GET` | `/categories/:id` | Detalha uma categoria |
| `PATCH` | `/categories/:id` | Atualiza |
| `DELETE` | `/categories/:id` | Remove |
| `POST` | `/categories/seed-defaults` | Cria o conjunto de categorias padrão (idempotente) |

Corpo: `{ name, type, color, icon? }`
- `type`: `expense` | `income`
- `color`: hex (ex.: `#059669`)

`POST /categories/seed-defaults` retorna as categorias garantidas; rodar de novo não duplica.

---

## Regras de categorização — `/categorization-rules`

Associam uma palavra-chave a uma categoria; aplicadas na importação e na recategorização.

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/categorization-rules` | Cria regra |
| `GET` | `/categorization-rules` | Lista regras |
| `PATCH` | `/categorization-rules/:id` | Atualiza |
| `DELETE` | `/categorization-rules/:id` | Remove |
| `POST` | `/categorization-rules/recategorize` | Reaplica as regras às transações do usuário |

Corpo: `{ keyword, categoryId, priority? }` — `keyword` casa (case-insensitive) na descrição da
transação; `priority` desempata (menor primeiro). `recategorize` retorna `{ evaluated, categorized }`.

---

## Transações — `/transactions`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/transactions` | Cria transação manual |
| `GET` | `/transactions` | Lista com filtros e paginação |
| `GET` | `/transactions/:id` | Detalha |
| `PATCH` | `/transactions/:id` | Atualiza |
| `DELETE` | `/transactions/:id` | Remove |

Corpo: `{ date, description, type, amount, accountId, categoryId? }`
- `type`: `income` | `expense` · `amount`: número **positivo** (o sinal na UI vem do `type`)
- `accountId`/`categoryId` precisam pertencer ao usuário (senão `404`/validação).

Query de `GET /transactions` (todos opcionais): `from`, `to` (datas), `accountId`, `categoryId`,
`type`, `page`, `pageSize` (limitado a 100). Retorna a página de transações + metadados de paginação.

---

## Importação — `/imports`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/imports` | Importa um extrato (multipart) |
| `GET` | `/imports` | Histórico de importações do usuário |

**`POST /imports`** — `multipart/form-data` com o campo `file` (arquivo `.csv` ou `.ofx`) e
`accountId`. O backend detecta o formato, faz o parsing, deduplica por *fingerprint* e cria as
transações (`source=import`), já aplicando as regras de categorização. Retorno:
`{ importId, totalRows, importedRows, duplicateRows }`.

Erros: `404` conta inválida (`import.account.not.found`); `422` formato/arquivo inválido
(`import.format.unsupported`, `import.file.empty`); `413` arquivo muito grande (`import.file.too.large`).

Detalhes de formato CSV/OFX: [`import.md`](import.md).

---

## Orçamentos — `/budgets`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/budgets` | Cria orçamento |
| `GET` | `/budgets` | Lista orçamentos |
| `GET` | `/budgets/progress?month=YYYY-MM` | Consumo do mês por categoria |
| `PATCH` | `/budgets/:id` | Atualiza |
| `DELETE` | `/budgets/:id` | Remove |

Corpo: `{ categoryId, month, limitAmount }` — `month` em `YYYY-MM`, `limitAmount > 0`. Único por
`(usuário, categoria, mês)` — duplicado responde `409` (`budget.already.exists`).

`GET /budgets/progress` retorna, para cada orçamento do mês:
`[{ categoryId, limit, spent, percent }]` (o `spent` soma as despesas reais da categoria no mês).

---

## Analytics (dashboard) — `/analytics`

Agregações **somente leitura**, escopadas por usuário.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/analytics/summary?month=YYYY-MM` | `{ totalIncome, totalExpense, balance, transactionCount }` |
| `GET` | `/analytics/spending-by-category?month=YYYY-MM` | `[{ categoryId, name, color, total }]` (só despesas) |
| `GET` | `/analytics/monthly-evolution?months=6` | `[{ month, income, expense }]` dos últimos N meses |
