import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CategoriesModule } from '../categories/categories.module';
import { BudgetsController } from './budgets.controller';
import { PrismaBudgetRepository } from './budget.prisma';

@Module({
  imports: [DbModule, CategoriesModule],
  controllers: [BudgetsController],
  providers: [PrismaBudgetRepository],
  exports: [PrismaBudgetRepository],
})
export class BudgetsModule {}
