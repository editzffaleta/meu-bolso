import { Budget, BudgetRepository } from "../../src";

export class FakeBudgetRepository implements BudgetRepository {
  private readonly storage = new Map<string, Budget>();
  private readonly spentByCategoryMonth = new Map<string, number>();

  constructor(initialBudgets: Budget[] = []) {
    for (const budget of initialBudgets) {
      this.storage.set(budget.id, budget);
    }
  }

  get budgets(): Budget[] {
    return Array.from(this.storage.values());
  }

  setSpent(categoryId: string, month: string, spent: number): void {
    this.spentByCategoryMonth.set(`${categoryId}:${month}`, spent);
  }

  async create(entity: Budget): Promise<Budget> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async update(entity: Budget): Promise<Budget> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = this.storage.get(id);

    if (existing && existing.userId === userId) {
      this.storage.delete(id);
    }
  }

  async findById(id: string, userId: string): Promise<Budget | null> {
    const existing = this.storage.get(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    return existing;
  }

  async findByCategoryAndMonth(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<Budget | null> {
    const found = this.budgets.find(
      (budget) =>
        budget.userId === userId &&
        budget.categoryId === categoryId &&
        budget.month === month,
    );

    return found ?? null;
  }

  async list(userId: string, month?: string): Promise<Budget[]> {
    return this.budgets.filter(
      (budget) =>
        budget.userId === userId && (month ? budget.month === month : true),
    );
  }

  async sumSpentByCategory(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<number> {
    void userId;
    return this.spentByCategoryMonth.get(`${categoryId}:${month}`) ?? 0;
  }
}
