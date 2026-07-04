import {
  CategorizationRule,
  CategorizationRuleRepository,
} from "@meubolso/categories";

export class FakeCategorizationRuleRepository
  implements CategorizationRuleRepository
{
  private readonly storage = new Map<string, CategorizationRule>();

  constructor(initialRules: CategorizationRule[] = []) {
    for (const rule of initialRules) {
      this.storage.set(rule.id, rule);
    }
  }

  get rules(): CategorizationRule[] {
    return Array.from(this.storage.values());
  }

  async create(entity: CategorizationRule): Promise<CategorizationRule> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async update(entity: CategorizationRule): Promise<CategorizationRule> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = this.storage.get(id);

    if (existing && existing.userId === userId) {
      this.storage.delete(id);
    }
  }

  async findById(id: string, userId: string): Promise<CategorizationRule | null> {
    const existing = this.storage.get(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    return existing;
  }

  async findAllByUser(userId: string): Promise<CategorizationRule[]> {
    return this.rules
      .filter((rule) => rule.userId === userId)
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }

        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
}
