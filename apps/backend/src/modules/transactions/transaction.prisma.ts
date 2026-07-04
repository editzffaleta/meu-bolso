import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  Transaction,
  TransactionFilters,
  TransactionListResult,
  TransactionRepository,
  TransactionSource,
  TransactionType,
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
