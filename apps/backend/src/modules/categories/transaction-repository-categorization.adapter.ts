import { TransactionRepository } from '@meubolso/transactions';
import {
  CategorizableTransaction,
  TransactionCategorizationPort,
} from '@meubolso/categories';

/**
 * Adapta o `TransactionRepository` real (de `@meubolso/transactions`) para o
 * `TransactionCategorizationPort` esperado por `apply-rules`/`recategorize-all`
 * (de `@meubolso/categories`). Mantido na camada de infraestrutura do backend
 * (em vez de dentro do modulo `categories` do dominio) para nao criar
 * dependencia ciclica entre `categories` e `transactions`.
 */
export class TransactionRepositoryCategorizationAdapter implements TransactionCategorizationPort {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async findByIds(
    ids: string[],
    userId: string,
  ): Promise<CategorizableTransaction[]> {
    return this.transactionRepository.findByIds(ids, userId);
  }

  async findAllWithoutCategory(
    userId: string,
  ): Promise<CategorizableTransaction[]> {
    return this.transactionRepository.findAllWithoutCategory(userId);
  }

  async findAllByUser(userId: string): Promise<CategorizableTransaction[]> {
    return this.transactionRepository.findAllByUser(userId);
  }

  async update(
    entity: CategorizableTransaction,
  ): Promise<CategorizableTransaction> {
    return this.transactionRepository.update(
      entity as unknown as Parameters<TransactionRepository['update']>[0],
    );
  }

  async updateMany(
    entities: CategorizableTransaction[],
  ): Promise<CategorizableTransaction[]> {
    return this.transactionRepository.updateMany(
      entities as unknown as Parameters<TransactionRepository['updateMany']>[0],
    );
  }
}
