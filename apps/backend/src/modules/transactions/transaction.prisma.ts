import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CategorySpendingSummary,
  MonthlyTransactionSummary,
  Transaction,
  TransactionFilters,
  TransactionListResult,
  TransactionRepository,
  TransactionSource,
  TransactionType,
  TransactionTypeSummary,
} from '@meubolso/transactions';
import { PrismaService } from '../../db/prisma.service';

interface TransactionRaw {
  id: string;
  date: Date;
  description: string;
  type: string;
  amount: Prisma.Decimal;
  accountId: string;
  categoryId: string | null;
  source: string;
  importId: string | null;
  fingerprint: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Transaction): Promise<Transaction> {
    const created = await this.prisma.transaction.create({
      data: this.toPersistence(entity),
    });

    return this.toDomain(created);
  }

  async update(entity: Transaction): Promise<Transaction> {
    const updated = await this.prisma.transaction.update({
      where: { id: entity.id, userId: entity.userId },
      data: this.toPersistence(entity),
    });

    return this.toDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.transaction.deleteMany({
      where: { id, userId },
    });
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const found = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    return found ? this.toDomain(found) : null;
  }

  async findMany(
    filters: TransactionFilters,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<TransactionListResult> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.from || filters.to
        ? {
            date: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toDomain(item)),
      total,
    };
  }

  async findByFingerprints(
    userId: string,
    fingerprints: string[],
  ): Promise<string[]> {
    if (fingerprints.length === 0) {
      return [];
    }

    const found = await this.prisma.transaction.findMany({
      where: { userId, fingerprint: { in: fingerprints } },
      select: { fingerprint: true },
    });

    return found.map((item) => item.fingerprint);
  }

  async findByIds(ids: string[], userId: string): Promise<Transaction[]> {
    if (ids.length === 0) {
      return [];
    }

    const found = await this.prisma.transaction.findMany({
      where: { userId, id: { in: ids } },
    });

    return found.map((item) => this.toDomain(item));
  }

  async findAllWithoutCategory(userId: string): Promise<Transaction[]> {
    const found = await this.prisma.transaction.findMany({
      where: { userId, categoryId: null },
    });

    return found.map((item) => this.toDomain(item));
  }

  async findAllByUser(userId: string): Promise<Transaction[]> {
    const found = await this.prisma.transaction.findMany({
      where: { userId },
    });

    return found.map((item) => this.toDomain(item));
  }

  async sumByType(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<TransactionTypeSummary> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    const summary: TransactionTypeSummary = { income: 0, expense: 0, count: 0 };

    for (const group of grouped) {
      const total = Number(group._sum.amount ?? 0);

      if (group.type === 'income') {
        summary.income += total;
      } else {
        summary.expense += total;
      }

      summary.count += group._count._all;
    }

    return summary;
  }

  async sumByCategory(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<CategorySpendingSummary[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'expense', date: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    return grouped.map((group) => ({
      categoryId: group.categoryId,
      total: Number(group._sum.amount ?? 0),
    }));
  }

  async sumByMonth(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<MonthlyTransactionSummary[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: from, lte: to } },
      select: { date: true, type: true, amount: true },
    });

    const totals = new Map<string, MonthlyTransactionSummary>();

    for (const transaction of transactions) {
      const month = toMonthKey(transaction.date);
      const current = totals.get(month) ?? { month, income: 0, expense: 0 };
      const amount = Number(transaction.amount);

      if (transaction.type === 'income') {
        current.income += amount;
      } else {
        current.expense += amount;
      }

      totals.set(month, current);
    }

    return Array.from(totals.values());
  }

  private toPersistence(transaction: Transaction) {
    return {
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      type: transaction.type,
      amount: transaction.amount,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId ?? null,
      source: transaction.source,
      importId: transaction.importId ?? null,
      fingerprint: transaction.fingerprint,
      userId: transaction.userId,
    };
  }

  private toDomain(raw: TransactionRaw): Transaction {
    return new Transaction({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      date: raw.date,
      description: raw.description,
      type: raw.type as TransactionType,
      amount: Number(raw.amount),
      accountId: raw.accountId,
      categoryId: raw.categoryId,
      source: raw.source as TransactionSource,
      importId: raw.importId,
      fingerprint: raw.fingerprint,
      userId: raw.userId,
    });
  }
}

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}
