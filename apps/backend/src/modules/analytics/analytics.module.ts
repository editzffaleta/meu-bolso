import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { PrismaCategoryRepository } from '../categories/category.prisma';
import { PrismaTransactionRepository } from '../transactions/transaction.prisma';
import { AnalyticsController } from './analytics.controller';

// Nota: nao importamos CategoriesModule/TransactionsModule aqui para evitar
// dependencia ciclica entre modulos Nest (ambos ja se referenciam). Os
// repositorios Prisma so precisam de PrismaService (via DbModule), entao
// podem ser fornecidos diretamente como providers locais.
@Module({
  imports: [DbModule],
  controllers: [AnalyticsController],
  providers: [PrismaTransactionRepository, PrismaCategoryRepository],
})
export class AnalyticsModule {}
