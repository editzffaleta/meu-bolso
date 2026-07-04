# Contribuindo

Obrigado pelo interesse! Este guia resume o fluxo de trabalho do meu-bolso.

## Antes de começar

- Leia o [guia de desenvolvimento](docs/desenvolvimento.md) para o setup local.
- Familiarize-se com a [arquitetura](docs/arquitetura.md) — o domínio (`modules/*`) não depende de
  framework nem de ORM.

## Fluxo

1. Crie uma branch a partir da `main` (ex.: `feat/orcamentos-anuais`, `fix/dedup-ofx`).
2. Faça as alterações mantendo o padrão do código ao redor.
3. Garanta que o gate passa localmente:
   ```bash
   npm run lint && npm run check-types && npm run test && npm run build
   ```
4. Abra um Pull Request para a `main`. A CI precisa estar **verde** para o merge.

## Padrão de commits

**Conventional Commits em português**, com o *porquê* em 1–2 frases quando fizer sentido:

```
feat: adiciona orçamento anual por categoria
fix: corrige data do OFX quando vem com fuso
docs: documenta o endpoint de recategorização
```

Prefixos usados: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.

## Regras que a revisão verifica

- **Isolamento por usuário**: toda leitura/escrita de dado de domínio é escopada por `userId` (lido
  do JWT, nunca do corpo/query). Endpoint ou query sem esse filtro é bloqueante.
- **Regra de dependência**: `modules/*` (domínio) não importa NestJS/Prisma; casos de uso recebem
  *ports*. A implementação Prisma vive em `apps/backend`.
- **Testes**: casos de uso e entidades cobertos com *fakes*; fluxos críticos cobertos por e2e.
- **Sem segredos**: só `.env.example` é versionado. Nunca commite `.env` ou credenciais.
- **Novo módulo**: declare no `package.json` do módulo os pacotes `@meubolso/*` que ele importa
  (o CI ordena o build por essas dependências).

## Estrutura de um módulo de domínio

```
modules/<nome>/
  src/<agregado>/
    model/        # entidade rica (Entity<State>) + validação
    provider/     # ports (interfaces de repositório/serviços)
    usecase/      # casos de uso (UseCase<In, Out>)
  test/           # testes com fakes em memória
apps/backend/src/modules/<nome>/
  <nome>.controller.ts   # rotas (finas)
  <nome>.module.ts       # wiring Nest
  <agregado>.prisma.ts   # repositório Prisma (implementa a port)
```
