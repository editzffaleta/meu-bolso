import { Injectable } from '@nestjs/common';
import {
  Category,
  CategoryRepository,
  CategoryType,
} from '@meubolso/categories';
import { PrismaService } from '../../db/prisma.service';

interface CategoryRaw {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Category): Promise<Category> {
    const created = await this.prisma.category.create({
      data: this.toPersistence(entity),
    });

    return this.toDomain(created);
  }

  async update(entity: Category): Promise<Category> {
    const updated = await this.prisma.category.update({
      where: { id: entity.id, userId: entity.userId },
      data: this.toPersistence(entity),
    });

    return this.toDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.category.deleteMany({
      where: { id, userId },
    });
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const found = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    return found ? this.toDomain(found) : null;
  }

  async findAll(userId: string): Promise<Category[]> {
    const found = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return found.map((item) => this.toDomain(item));
  }

  async findByNames(names: string[], userId: string): Promise<Category[]> {
    if (names.length === 0) {
      return [];
    }

    const found = await this.prisma.category.findMany({
      where: {
        userId,
        OR: names.map((name) => ({
          name: { equals: name, mode: 'insensitive' as const },
        })),
      },
    });

    return found.map((item) => this.toDomain(item));
  }

  private toPersistence(category: Category) {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon ?? null,
      isDefault: category.isDefault,
      userId: category.userId,
    };
  }

  private toDomain(raw: CategoryRaw): Category {
    return new Category({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      name: raw.name,
      type: raw.type as CategoryType,
      color: raw.color,
      icon: raw.icon,
      isDefault: raw.isDefault,
      userId: raw.userId,
    });
  }
}
