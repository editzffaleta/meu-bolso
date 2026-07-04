import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { PrismaAccountRepository } from '../accounts/account.prisma';
import { PrismaCategoryRepository } from '../categories/category.prisma';
import { PrismaTransactionRepository } from '../transactions/transaction.prisma';
import { AnalyticsController } from './analytics.controller';

// Nota: nao importamos CategoriesModule/TransactionsModule/AccountsModule
// aqui para evitar dependencia ciclica entre modulos Nest. Os repositorios
// Prisma so precisam de PrismaService (via DbModule), entao podem ser
// fornecidos diretamente como providers locais.
@Module({
  imports: [DbModule],
  controllers: [AnalyticsController],
  providers: [
    PrismaTransactionRepository,
    PrismaCategoryRepository,
    PrismaAccountRepository,
  ],
})
export class AnalyticsModule {}
