import {
  Transaction,
  TransactionFilters,
  TransactionListResult,
  TransactionRepository,
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
}
