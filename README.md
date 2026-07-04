# meu-bolso 💰

[![CI](https://github.com/editzffaleta/meu-bolso/actions/workflows/ci.yml/badge.svg)](https://github.com/editzffaleta/meu-bolso/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Dashboard de **finanças pessoais** full-stack: importe extratos bancários em **CSV/OFX**, tenha os
gastos **categorizados automaticamente** e acompanhe para onde o dinheiro vai em **gráficos mensais**.

> Projeto pessoal — construído para praticar arquitetura full-stack limpa de ponta a ponta
> (domínio → API → UI), com testes e CI.

## 📸 Telas

![Dashboard do meu-bolso](screenshots/dashboard.png)

<p align="center">
  <img src="screenshots/transacoes.png" width="49%" alt="Transações com filtros" />
  <img src="screenshots/orcamentos.png" width="49%" alt="Orçamentos com barras de progresso" />
</p>

## ✨ Funcionalidades

- **Contas** — cadastre contas/carteiras (corrente, poupança, carteira, cartão).
- **Transações** — lançamento manual e listagem com filtros por período, conta, categoria e tipo.
- **Importação CSV/OFX** — upload de extrato, parsing, deduplicação e criação automática das transações.
- **Categorização automática** — regras `palavra-chave → categoria` aplicadas na importação, com
  recategorização em massa.
- **Orçamentos** — limite de gasto por categoria/mês com acompanhamento de consumo.
- **Dashboard** — saldo, receitas × despesas, gasto por categoria e evolução mensal em gráficos.
- **Multiusuário** — cada pessoa acessa somente os próprios dados (autenticação JWT).

## 🧱 Stack

| Camada | Tecnologia |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Backend | NestJS (TypeScript) · porta 4000 |
| Frontend | Next.js (App Router) · porta 3000 |
| Banco | PostgreSQL + Prisma |
| Gráficos | Recharts |
| Testes | Jest (unit/integração) + Playwright (e2e) |

Arquitetura em camadas (Clean Architecture + DDD): o domínio não depende de framework nem de ORM;
os casos de uso recebem *ports* e a persistência Prisma as implementa.

## 🚀 Rodando localmente

Pré-requisitos: **Node 20+**, **npm** e um **PostgreSQL** acessível.

```bash
# 1. dependências
npm install

# 2. variáveis de ambiente (copie e ajuste)
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. banco (migrations)
npm run db:migrate --workspace @meubolso/backend

# 4. subir backend (:4000) + frontend (:3000)
npm run dev
```

Acesse `http://localhost:3000`.

## 🎬 Rodar dados de demonstração

Para abrir o dashboard já populado (contas, categorias, ~6 meses de transações, regras de
categorização e orçamentos), rode o seed de demonstração após subir o banco e aplicar as
migrations:

```bash
# garanta que SEED_DEMO_PASSWORD está definida em apps/backend/.env
# (valor de exemplo documentado em apps/backend/.env.example)
npm run seed:demo
```

Depois, faça login com `demo@meubolso.app` e a senha definida em `SEED_DEMO_PASSWORD`. O script é
idempotente — pode ser executado novamente sem duplicar dados.

## 📂 Estrutura

```
apps/
  backend/    # API NestJS (módulos de domínio, Prisma)
  frontend/   # UI Next.js (App Router)
packages/     # configs e libs compartilhadas do monorepo
```

## 🧪 Qualidade

```bash
npm run lint        # ESLint
npm run test        # testes unitários/integração
npm run build       # build de produção
```

CI no GitHub Actions roda lint, typecheck, testes e build a cada push/PR.

## 📄 Licença

MIT.
