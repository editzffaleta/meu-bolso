# Importação de extratos (CSV/OFX)

Você envia um extrato e escolhe a conta de destino (`POST /imports`, multipart). O backend detecta o
formato, faz o parsing, **deduplica** reimportações e cria as transações — que já nascem
**categorizadas** pelas regras de `palavra-chave → categoria`.

## Pipeline

```
arquivo (.csv/.ofx) + accountId
   → detecta o formato (extensão/conteúdo)
   → parser dedicado (CsvStatementParser | OfxStatementParser) → linhas { date, description, amount }
   → calcula o fingerprint de cada linha (hash de data + valor + descrição normalizados)
   → descarta as que já existem em transações source=import do usuário  (dedup)
   → cria as transações restantes (source=import, importId)
   → aplica as regras de categorização (apply-rules)
   → registra o Import com { totalRows, importedRows, duplicateRows }
```

## Formato CSV

Header **flexível** — os nomes de coluna aceitam sinônimos:

| Campo | Cabeçalhos aceitos |
|---|---|
| Data | `data`, `date`, `dt` |
| Descrição | `descricao`, `descrição`, `description`, `memo` |
| Valor | `valor`, `amount`, `value` |

O valor é assinado: **negativo = despesa**, positivo = receita.

```csv
data,descricao,valor
2026-06-01,MERCADO SUPERMERCADO,-150.32
2026-06-03,Salario,4500.00
2026-06-05,Restaurante Sabor,-89.90
```

## Formato OFX

SGML de banco (tags sem fechamento obrigatório). O parser lê cada bloco `<STMTTRN>`, extraindo
`<DTPOSTED>` (data `YYYYMMDD`), `<TRNAMT>` (valor assinado) e `<MEMO>` (descrição; usa `<NAME>` como
fallback).

```xml
<STMTTRN>
  <TRNTYPE>DEBIT
  <DTPOSTED>20260601
  <TRNAMT>-150.32
  <MEMO>MERCADO SUPERMERCADO
</STMTTRN>
```

## Deduplicação

Cada lançamento recebe um *fingerprint* (hash de data + valor + descrição). Ao reenviar o mesmo
extrato, as linhas repetidas são ignoradas (contam como `duplicateRows` no resumo). A unicidade é
garantida por um índice **parcial** no banco (`WHERE source = 'import'`), então **lançamentos manuais
idênticos e legítimos continuam permitidos** — só a importação é deduplicada.

## Arquivos de exemplo

Há fixtures prontos em [`apps/e2e/fixtures/`](../apps/e2e/fixtures): `extrato-exemplo.csv` e
`extrato-exemplo.ofx`. Limite de tamanho de upload: 2 MB (`413 import.file.too.large` se exceder).
