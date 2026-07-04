import { ConflictError } from "@meubolso/shared";
import { Transaction, TransactionRepository } from "@meubolso/transactions";
import {
  Import,
  ImportListResult,
  ImportRepository,
  ImportTransactionsResult,
} from "../../src";

export class FakeImportRepository implements ImportRepository {
  private readonly storage = new Map<string, Import>();

  /**
   * Injetado opcionalmente pelo teste para que `createWithTransactions`
   * grave as transacoes no mesmo `FakeTransactionRepository` usado pelo
   * caso de uso, simulando a atomicidade real (M6).
   */
  constructor(
    initialImports: Import[] = [],
    private readonly transactionRepository?: TransactionRepository,
    /**
     * Quando definido, `createWithTransactions` lanca este erro em vez de
     * gravar -- usado para simular falhas genericas (ex.: erro de conexao)
     * no teste do caminho "failed" (M6).
     */
    private readonly forceCreateWithTransactionsError?: Error,
  ) {
    for (const item of initialImports) {
      this.storage.set(item.id, item);
    }
  }

  get imports(): Import[] {
    return Array.from(this.storage.values());
  }

  async create(entity: Import): Promise<Import> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async update(entity: Import): Promise<Import> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async findPage(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<ImportListResult> {
    const filtered = this.imports
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;

    return { items: filtered.slice(start, start + pageSize), total };
  }

  async createWithTransactions(
    importEntity: Import,
    transactions: Transaction[],
  ): Promise<ImportTransactionsResult> {
    if (this.forceCreateWithTransactionsError) {
      throw this.forceCreateWithTransactionsError;
    }

    if (!this.transactionRepository) {
      throw new Error(
        "FakeImportRepository.createWithTransactions requer um transactionRepository injetado no construtor",
      );
    }

    const createdTransactions: Transaction[] = [];

    for (const transaction of transactions) {
      const owned = await this.transactionRepository.findByFingerprints(
        transaction.userId,
        [transaction.fingerprint],
      );

      if (owned.includes(transaction.fingerprint)) {
        throw new ConflictError("import.transaction.duplicate");
      }

      const created = await this.transactionRepository.create(transaction);
      createdTransactions.push(created);
    }

    this.storage.set(importEntity.id, importEntity);

    return { importEntity, createdTransactions };
  }
}
