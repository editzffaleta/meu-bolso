import { Category, CategoryRepository } from "../../src";

export class FakeCategoryRepository implements CategoryRepository {
  private readonly storage = new Map<string, Category>();

  constructor(initialCategories: Category[] = []) {
    for (const category of initialCategories) {
      this.storage.set(category.id, category);
    }
  }

  get categories(): Category[] {
    return Array.from(this.storage.values());
  }

  async create(entity: Category): Promise<Category> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async update(entity: Category): Promise<Category> {
    this.storage.set(entity.id, entity);
    return entity;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = this.storage.get(id);

    if (existing && existing.userId === userId) {
      this.storage.delete(id);
    }
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const existing = this.storage.get(id);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    return existing;
  }

  async findAll(userId: string): Promise<Category[]> {
    return this.categories.filter((category) => category.userId === userId);
  }

  async findByNames(names: string[], userId: string): Promise<Category[]> {
    const normalizedNames = names.map((name) => name.toLowerCase());

    return this.categories.filter(
      (category) =>
        category.userId === userId &&
        normalizedNames.includes(category.name.toLowerCase()),
    );
  }
}
