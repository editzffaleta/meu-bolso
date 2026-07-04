import {
  CategorySpendingSummary,
  MonthlyTransactionSummary,
  Transaction,
  TransactionFilters,
  TransactionListResult,
  TransactionRepository,
  TransactionTypeSummary,
} from "../../src";

export class FakeTransactionRepository implements TransactionRepository {
  private readonly storage = new Map<string, Transaction>();

  constructor(initialTransactions: Transaction[] = []) {
    for (const transaction of initialTransactions) {
      this.storage.set(transaction.id, transaction);
    }
  }

  get transactions(): Transaction[] {
    return Array.from(this.storage.values());
  }

  async create(entity: Transaction): Promise<Transaction> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async update(entity: Transaction): Promise<Transaction> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  /**
   * Simula a atomicidade (tudo ou nada) exigida pelo contrato: aplica as
   * atualizacoes num snapshot separado e so grava no storage real se
   * `failAfter` (auxiliar de teste) nao interromper o lote no meio,
   * permitindo testar reversao em caso de falha.
   */
  async updateMany(entities: Transaction[]): Promise<Transaction[]> {
    if (entities.length === 0) {
      return [];
    }

    const snapshot = new Map(this.storage);

    for (let i = 0; i < entities.length; i += 1) {
      if (this.failAfter !== undefined && i >= this.failAfter) {
        throw new Error("falha simulada no meio do lote");
      }

      snapshot.set(entities[i].id, entities[i]);
    }

    this.storage.clear();
    for (const [id, transaction] of snapshot) {
      this.storage.set(id, transaction);
    }

    return entities;
  }

  /**
   * Auxiliar de teste (nao faz parte do contrato): faz `updateMany` lancar
   * apos aplicar `failAfter` atualizacoes, sem persistir nenhuma delas,
   * simulando uma falha no meio de uma transacao de banco real.
   */
  failAfter?: number;

  async delete(id: string, userId: string): Promise<void> {
    const existing = this.storage.get(id);

    if (existing && existing.userId === userId) {
      this.storage.delete(id);
    }
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const existing = this.storage.get(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    return existing;
  }

  async findMany(
    filters: TransactionFilters,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<TransactionListResult> {
    const filtered = this.transactions
      .filter((transaction) => transaction.userId === userId)
      .filter((transaction) =>
        filters.from ? transaction.date >= filters.from : true,
      )
      .filter((transaction) =>
        filters.to ? transaction.date <= filters.to : true,
      )
      .filter((transaction) =>
        filters.accountId ? transaction.accountId === filters.accountId : true,
      )
      .filter((transaction) =>
        filters.categoryId
          ? transaction.categoryId === filters.categoryId
          : true,
      )
      .filter((transaction) =>
        filters.type ? transaction.type === filters.type : true,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total };
  }

  async findByFingerprints(
    userId: string,
    fingerprints: string[],
  ): Promise<string[]> {
    const owned = new Set(
      this.transactions
        .filter((transaction) => transaction.userId === userId)
        .map((transaction) => transaction.fingerprint),
    );

    return fingerprints.filter((fingerprint) => owned.has(fingerprint));
  }

  async findByIds(ids: string[], userId: string): Promise<Transaction[]> {
    const idSet = new Set(ids);

    return this.transactions.filter(
      (transaction) => transaction.userId === userId && idSet.has(transaction.id),
    );
  }

  async findAllWithoutCategory(userId: string): Promise<Transaction[]> {
    return this.transactions.filter(
      (transaction) => transaction.userId === userId && !transaction.categoryId,
    );
  }

  async findAllByUser(userId: string): Promise<Transaction[]> {
    return this.transactions.filter(
      (transaction) => transaction.userId === userId,
    );
  }

  async sumByType(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<TransactionTypeSummary> {
    const scoped = this.inRange(userId, from, to);

    return scoped.reduce<TransactionTypeSummary>(
      (acc, transaction) => {
        if (transaction.type === "income") {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        acc.count += 1;
        return acc;
      },
      { income: 0, expense: 0, count: 0 },
    );
  }

  async sumByCategory(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<CategorySpendingSummary[]> {
    const scoped = this.inRange(userId, from, to).filter(
      (transaction) => transaction.type === "expense",
    );

    const totals = new Map<string | null, number>();

    for (const transaction of scoped) {
      const key = transaction.categoryId ?? null;
      totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
    }

    return Array.from(totals.entries()).map(([categoryId, total]) => ({
      categoryId,
      total,
    }));
  }

  async sumByMonth(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<MonthlyTransactionSummary[]> {
    const scoped = this.inRange(userId, from, to);

    const totals = new Map<string, MonthlyTransactionSummary>();

    for (const transaction of scoped) {
      const month = toMonthKey(transaction.date);
      const current = totals.get(month) ?? { month, income: 0, expense: 0 };

      if (transaction.type === "income") {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }

      totals.set(month, current);
    }

    return Array.from(totals.values());
  }

  private inRange(userId: string, from: Date, to: Date): Transaction[] {
    return this.transactions.filter(
      (transaction) =>
        transaction.userId === userId &&
        transaction.date >= from &&
        transaction.date <= to,
    );
  }
}

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}
