import { Import, ImportListResult, ImportRepository } from "../../src";

export class FakeImportRepository implements ImportRepository {
  private readonly storage = new Map<string, Import>();

  constructor(initialImports: Import[] = []) {
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
}
