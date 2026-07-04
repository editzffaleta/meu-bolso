import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsController } from './transactions.controller';
import { PrismaTransactionRepository } from './transaction.prisma';

@Module({
  imports: [DbModule, AccountsModule, CategoriesModule],
  controllers: [TransactionsController],
  providers: [PrismaTransactionRepository],
  exports: [PrismaTransactionRepository],
})
export class TransactionsModule {}
