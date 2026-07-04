import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Budget, BudgetRepository } from '@meubolso/budgets';
import { PrismaService } from '../../db/prisma.service';

interface BudgetRaw {
  id: string;
  categoryId: string;
  month: string;
  limitAmount: Prisma.Decimal;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class PrismaBudgetRepository implements BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Budget): Promise<Budget> {
    const created = await this.prisma.budget.create({
      data: this.toPersistence(entity),
    });

    return this.toDomain(created);
  }

  async update(entity: Budget): Promise<Budget> {
    const updated = await this.prisma.budget.update({
      where: { id: entity.id, userId: entity.userId },
      data: this.toPersistence(entity),
    });

    return this.toDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.budget.deleteMany({
      where: { id, userId },
    });
  }

  async findById(id: string, userId: string): Promise<Budget | null> {
    const found = await this.prisma.budget.findFirst({
      where: { id, userId },
    });

    return found ? this.toDomain(found) : null;
  }

  async findByCategoryAndMonth(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<Budget | null> {
    const found = await this.prisma.budget.findFirst({
      where: { userId, categoryId, month },
    });

    return found ? this.toDomain(found) : null;
  }

  async list(userId: string, month?: string): Promise<Budget[]> {
    const found = await this.prisma.budget.findMany({
      where: {
        userId,
        ...(month ? { month } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return found.map((item) => this.toDomain(item));
  }

  async sumSpentByCategory(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<number> {
    const { start, end } = monthBounds(month);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'expense',
        date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  private toPersistence(budget: Budget) {
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      month: budget.month,
      limitAmount: budget.limitAmount,
      userId: budget.userId,
    };
  }

  private toDomain(raw: BudgetRaw): Budget {
    return new Budget({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      categoryId: raw.categoryId,
      month: raw.month,
      limitAmount: Number(raw.limitAmount),
      userId: raw.userId,
    });
  }
}

function monthBounds(month: string): { start: Date; end: Date } {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));

  return { start, end };
}
