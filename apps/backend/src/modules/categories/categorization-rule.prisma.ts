import { Injectable } from '@nestjs/common';
import {
  CategorizationRule,
  CategorizationRuleRepository,
} from '@meubolso/categories';
import { PrismaService } from '../../db/prisma.service';

interface CategorizationRuleRaw {
  id: string;
  keyword: string;
  priority: number;
  categoryId: string;
  userId: string;
  createdAt: Date;
}

@Injectable()
export class PrismaCategorizationRuleRepository implements CategorizationRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: CategorizationRule): Promise<CategorizationRule> {
    const created = await this.prisma.categorizationRule.create({
      data: this.toPersistence(entity),
    });

    return this.toDomain(created);
  }

  async update(entity: CategorizationRule): Promise<CategorizationRule> {
    const updated = await this.prisma.categorizationRule.update({
      where: { id: entity.id, userId: entity.userId },
      data: this.toPersistence(entity),
    });

    return this.toDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.categorizationRule.deleteMany({
      where: { id, userId },
    });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<CategorizationRule | null> {
    const found = await this.prisma.categorizationRule.findFirst({
      where: { id, userId },
    });

    return found ? this.toDomain(found) : null;
  }

  async findAllByUser(userId: string): Promise<CategorizationRule[]> {
    const found = await this.prisma.categorizationRule.findMany({
      where: { userId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return found.map((item) => this.toDomain(item));
  }

  private toPersistence(rule: CategorizationRule) {
    return {
      id: rule.id,
      keyword: rule.keyword,
      priority: rule.priority,
      categoryId: rule.categoryId,
      userId: rule.userId,
    };
  }

  private toDomain(raw: CategorizationRuleRaw): CategorizationRule {
    return new CategorizationRule({
      id: raw.id,
      createdAt: raw.createdAt,
      keyword: raw.keyword,
      priority: raw.priority,
      categoryId: raw.categoryId,
      userId: raw.userId,
    });
  }
}
