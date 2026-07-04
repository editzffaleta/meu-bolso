import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '@meubolso/shared';
import {
  Import,
  ImportFormat,
  ImportListResult,
  ImportRepository,
  ImportStatus,
  ImportTransactionsResult,
} from '@meubolso/imports';
import {
  Transaction,
  TransactionSource,
  TransactionType,
} from '@meubolso/transactions';
import { PrismaService } from '../../db/prisma.service';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

interface ImportRaw {
  id: string;
  fileName: string;
  format: string;
  status: string;
  accountId: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

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
export class PrismaImportRepository implements ImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Import): Promise<Import> {
    const created = await this.prisma.import.create({
      data: this.toPersistence(entity),
    });

    return this.toDomain(created);
  }

  async update(entity: Import): Promise<Import> {
    const updated = await this.prisma.import.update({
      where: { id: entity.id, userId: entity.userId },
      data: this.toPersistence(entity),
    });

    return this.toDomain(updated);
  }

  async findPage(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<ImportListResult> {
    const [items, total] = await Promise.all([
      this.prisma.import.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.import.count({ where: { userId } }),
    ]);

    return {
      items: items.map((item) => this.toDomain(item)),
      total,
    };
  }

  /**
   * Grava o `Import` (ja no status final) e as transacoes importadas dentro
   * de uma UNICA transacao de banco (`prisma.$transaction`). Introduzido na
   * auditoria M6: evita Import preso em "processing" e transacoes parciais
   * quando algo falha no meio da gravacao.
   *
   * Corrida (upload duplicado simultaneo) faz o indice unico parcial
   * `(userId, fingerprint) WHERE source='import'` disparar `P2002`, mapeado
   * aqui para `ConflictError` (HTTP 409) em vez de propagar como erro 500.
   */
  async createWithTransactions(
    importEntity: Import,
    transactions: Transaction[],
  ): Promise<ImportTransactionsResult> {
    try {
      const [createdImportRaw, ...createdTransactionRaws] =
        await this.prisma.$transaction([
          this.prisma.import.create({ data: this.toPersistence(importEntity) }),
          ...transactions.map((transaction) =>
            this.prisma.transaction.create({
              data: this.transactionToPersistence(transaction),
            }),
          ),
        ]);

      return {
        importEntity: this.toDomain(createdImportRaw),
        createdTransactions: (createdTransactionRaws as TransactionRaw[]).map(
          (raw) => this.transactionToDomain(raw),
        ),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictError('import.transaction.duplicate');
      }

      throw error;
    }
  }

  private toPersistence(entity: Import) {
    return {
      id: entity.id,
      fileName: entity.fileName,
      format: entity.format,
      status: entity.status,
      accountId: entity.accountId,
      totalRows: entity.totalRows,
      importedRows: entity.importedRows,
      duplicateRows: entity.duplicateRows,
      invalidRows: entity.invalidRows,
      userId: entity.userId,
    };
  }

  private transactionToPersistence(transaction: Transaction) {
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

  private toDomain(raw: ImportRaw): Import {
    return new Import({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      fileName: raw.fileName,
      format: raw.format as ImportFormat,
      status: raw.status as ImportStatus,
      accountId: raw.accountId,
      totalRows: raw.totalRows,
      importedRows: raw.importedRows,
      duplicateRows: raw.duplicateRows,
      invalidRows: raw.invalidRows,
      userId: raw.userId,
    });
  }

  private transactionToDomain(raw: TransactionRaw): Transaction {
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
