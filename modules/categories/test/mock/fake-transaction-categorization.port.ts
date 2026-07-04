import {
  CategorizableTransaction,
  TransactionCategorizationPort,
} from "../../src";

export class FakeTransactionCategorizationPort
  implements TransactionCategorizationPort
{
  private readonly storage = new Map<string, CategorizableTransaction>();

  constructor(initialTransactions: CategorizableTransaction[] = []) {
    for (const transaction of initialTransactions) {
      this.storage.set(transaction.id, transaction);
    }
  }

  get transactions(): CategorizableTransaction[] {
    return Array.from(this.storage.values());
  }

  async findByIds(
    ids: string[],
    userId: string,
  ): Promise<CategorizableTransaction[]> {
    const idSet = new Set(ids);

    return this.transactions.filter(
      (transaction) => transaction.userId === userId && idSet.has(transaction.id),
    );
  }

  async findAllWithoutCategory(
    userId: string,
  ): Promise<CategorizableTransaction[]> {
    return this.transactions.filter(
      (transaction) => transaction.userId === userId && !transaction.categoryId,
    );
  }

  async findAllByUser(userId: string): Promise<CategorizableTransaction[]> {
    return this.transactions.filter(
      (transaction) => transaction.userId === userId,
    );
  }

  async update(
    entity: CategorizableTransaction,
  ): Promise<CategorizableTransaction> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  /**
   * Auxiliar de teste (nao faz parte do contrato `TransactionCategorizationPort`):
   * busca uma unica transacao pelo id, escopada ao usuario.
   */
  async findById(
    id: string,
    userId: string,
  ): Promise<CategorizableTransaction | null> {
    const [found] = await this.findByIds([id], userId);
    return found ?? null;
  }
}
