import { Account, AccountRepository } from "@meubolso/accounts";

export class FakeAccountRepository implements AccountRepository {
  private readonly storage = new Map<string, Account>();

  constructor(initialAccounts: Account[] = []) {
    for (const account of initialAccounts) {
      this.storage.set(account.id, account);
    }
  }

  get accounts(): Account[] {
    return Array.from(this.storage.values());
  }

  async create(entity: Account): Promise<Account> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async update(entity: Account): Promise<Account> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = this.storage.get(id);

    if (existing && existing.userId === userId) {
      this.storage.delete(id);
    }
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    const existing = this.storage.get(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    return existing;
  }

  async findAll(userId: string): Promise<Account[]> {
    return this.accounts.filter((account) => account.userId === userId);
  }

  async sumInitialBalance(userId: string): Promise<number> {
    return this.accounts
      .filter((account) => account.userId === userId)
      .reduce((total, account) => total + account.initialBalance, 0);
  }
}
