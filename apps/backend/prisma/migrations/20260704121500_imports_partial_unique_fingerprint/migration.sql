-- Indice unico PARCIAL: a deduplicacao por fingerprint so vale para
-- transacoes IMPORTADAS (source = 'import'). Duas transacoes MANUAIS
-- identicas (mesma data/valor/descricao) continuam permitidas.
-- Ver decisao registrada em prisma/models/transactions.model.prisma.
CREATE UNIQUE INDEX "transactions_userId_fingerprint_import_key"
  ON "transactions" ("userId", "fingerprint")
  WHERE "source" = 'import';
