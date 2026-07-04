import { Injectable } from '@nestjs/common';
import {
  Import,
  ImportFormat,
  ImportListResult,
  ImportRepository,
  ImportStatus,
} from '@meubolso/imports';
import { PrismaService } from '../../db/prisma.service';

interface ImportRaw {
  id: string;
  fileName: string;
  format: string;
  status: string;
  accountId: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
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
      userId: entity.userId,
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
      userId: raw.userId,
    });
  }
}
