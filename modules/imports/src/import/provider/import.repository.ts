import { Transaction } from "@meubolso/transactions";
import { Import } from "../model";

export interface ImportListResult {
  items: Import[];
  total: number;
}

/**
 * Resultado da gravacao atomica de uma importacao (M6 da auditoria): o
 * `Import` finalizado (status "done") e as transacoes efetivamente
 * persistidas, na mesma transacao de banco.
 */
export interface ImportTransactionsResult {
  importEntity: Import;
  createdTransactions: Transaction[];
}

export interface ImportRepository {
  create(entity: Import): Promise<Import>;

  update(entity: Import): Promise<Import>;

  /**
   * Lista o historico de importacoes do usuario informado, ordenado por
   * createdAt desc (`page` comeca em 1).
   */
  findPage(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<ImportListResult>;

  /**
   * Grava, de forma ATOMICA (mesma transacao de banco), o `Import` ja no
   * status final ("done") e as transacoes importadas. Introduzido na
   * auditoria M6: antes, o Import era criado em "processing", as transacoes
   * inseridas uma a uma e o status atualizado para "done" ao final -- uma
   * falha no meio do processo deixava o Import preso em "processing" e
   * transacoes parciais gravadas.
   *
   * A implementacao concreta (Prisma) deve rodar tudo dentro de
   * `prisma.$transaction`. Em caso de violacao de unicidade por corrida
   * (Prisma P2002 no indice parcial `(userId, fingerprint) WHERE
   * source='import'`), a implementacao deve lancar `ConflictError` (nunca um
   * erro 500 generico) para que o chamador trate como duplicata.
   */
  createWithTransactions(
    importEntity: Import,
    transactions: Transaction[],
  ): Promise<ImportTransactionsResult>;
}
