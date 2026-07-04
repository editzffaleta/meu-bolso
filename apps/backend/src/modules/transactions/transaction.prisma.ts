import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { roundMoney } from '@meubolso/shared';
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

  async updateMany(entities: Transaction[]): Promise<Transaction[]> {
    if (entities.length === 0) {
      return [];
    }

    const updated = await this.prisma.$transaction(
      entities.map((entity) =>
        this.prisma.transaction.update({
          where: { id: entity.id, userId: entity.userId },
          data: this.toPersistence(entity),
        }),
      ),
    );

    return (updated as TransactionRaw[]).map((raw) => this.toDomain(raw));
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

    let income = new Prisma.Decimal(0);
    let expense = new Prisma.Decimal(0);
    let count = 0;

    for (const group of grouped) {
      const total = group._sum.amount ?? new Prisma.Decimal(0);

      if (group.type === 'income') {
        income = income.plus(total);
      } else {
        expense = expense.plus(total);
      }

      count += group._count._all;
    }

    return {
      income: roundMoney(income.toNumber()),
      expense: roundMoney(expense.toNumber()),
      count,
    };
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
      total: roundMoney(Number(group._sum.amount ?? 0)),
    }));
  }

  async sumByMonth(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<MonthlyTransactionSummary[]> {
    // `groupBy` do Prisma nao suporta agrupar por uma expressao derivada
    // (mes de `date`), entao a agregacao por mes usa `$queryRaw` com
    // `date_trunc` (feita no banco) e soma em Decimal, evitando tanto a
    // leitura de todas as linhas para o Node quanto a soma float em loop.
    const rows = await this.prisma.$queryRaw<
      { month: string; type: string; total: Prisma.Decimal }[]
    >(Prisma.sql`
      SELECT
        to_char(date_trunc('month', "date"), 'YYYY-MM') AS month,
        "type" AS type,
        SUM("amount") AS total
      FROM "transactions"
      WHERE "userId" = ${userId}
        AND "date" >= ${from}
        AND "date" <= ${to}
      GROUP BY 1, 2
    `);

    const totals = new Map<string, MonthlyTransactionSummary>();

    for (const row of rows) {
      const current = totals.get(row.month) ?? {
        month: row.month,
        income: 0,
        expense: 0,
      };
      const amount = roundMoney(Number(row.total));

      if (row.type === 'income') {
        current.income = amount;
      } else {
        current.expense = amount;
      }

      totals.set(row.month, current);
    }

    return Array.from(totals.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
  }

  async sumAllTime(userId: string): Promise<TransactionTypeSummary> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
      _count: { _all: true },
    });

    let income = new Prisma.Decimal(0);
    let expense = new Prisma.Decimal(0);
    let count = 0;

    for (const group of grouped) {
      const total = group._sum.amount ?? new Prisma.Decimal(0);

      if (group.type === 'income') {
        income = income.plus(total);
      } else {
        expense = expense.plus(total);
      }

      count += group._count._all;
    }

    return {
      income: roundMoney(income.toNumber()),
      expense: roundMoney(expense.toNumber()),
      count,
    };
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
