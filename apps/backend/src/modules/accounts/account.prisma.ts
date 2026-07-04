import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { roundMoney } from '@meubolso/shared';
import { Account, AccountRepository, AccountType } from '@meubolso/accounts';
import { PrismaService } from '../../db/prisma.service';

interface AccountRaw {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  initialBalance: { toNumber(): number } | number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: Account): Promise<Account> {
    const created = await this.prisma.account.create({
      data: this.toPersistence(entity),
    });

    return this.toDomain(created);
  }

  async update(entity: Account): Promise<Account> {
    const updated = await this.prisma.account.update({
      where: { id: entity.id, userId: entity.userId },
      data: this.toPersistence(entity),
    });

    return this.toDomain(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.account.deleteMany({
      where: { id, userId },
    });
  }

  async findById(id: string, userId: string): Promise<Account | null> {
    const found = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    return found ? this.toDomain(found) : null;
  }

  async findAll(userId: string): Promise<Account[]> {
    const found = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return found.map((item) => this.toDomain(item));
  }

  async sumInitialBalance(userId: string): Promise<number> {
    const result = await this.prisma.account.aggregate({
      where: { userId },
      _sum: { initialBalance: true },
    });

    const total = result._sum.initialBalance ?? new Prisma.Decimal(0);

    return roundMoney(total.toNumber());
  }

  private toPersistence(account: Account) {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      institution: account.institution ?? null,
      initialBalance: account.initialBalance,
      userId: account.userId,
    };
  }

  private toDomain(raw: AccountRaw): Account {
    const initialBalance =
      typeof raw.initialBalance === 'number'
        ? raw.initialBalance
        : raw.initialBalance.toNumber();

    return new Account({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      name: raw.name,
      type: raw.type as AccountType,
      institution: raw.institution,
      initialBalance,
      userId: raw.userId,
    });
  }
}
