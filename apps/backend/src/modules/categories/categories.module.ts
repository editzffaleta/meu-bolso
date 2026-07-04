import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { PrismaTransactionRepository } from '../transactions/transaction.prisma';
import { CategoriesController } from './categories.controller';
import { CategorizationRulesController } from './categorization-rules.controller';
import { PrismaCategoryRepository } from './category.prisma';
import { PrismaCategorizationRuleRepository } from './categorization-rule.prisma';

// Nota: nao importamos TransactionsModule aqui (que ja importa
// CategoriesModule) para evitar dependencia ciclica entre modulos Nest.
// PrismaTransactionRepository so precisa de PrismaService (via DbModule),
// entao pode ser fornecido diretamente como provider local.
@Module({
  imports: [DbModule],
  controllers: [CategoriesController, CategorizationRulesController],
  providers: [
    PrismaCategoryRepository,
    PrismaCategorizationRuleRepository,
    PrismaTransactionRepository,
  ],
  exports: [PrismaCategoryRepository, PrismaCategorizationRuleRepository],
})
export class CategoriesModule {}
