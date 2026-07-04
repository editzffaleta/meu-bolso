import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CategoriesModule } from '../categories/categories.module';
import { ImportsController } from './imports.controller';
import { PrismaImportRepository } from './import.prisma';
import { CsvStatementParserImpl } from './csv-statement.parser';
import { OfxStatementParserImpl } from './ofx-statement.parser';

@Module({
  imports: [DbModule, AccountsModule, TransactionsModule, CategoriesModule],
  controllers: [ImportsController],
  providers: [
    PrismaImportRepository,
    CsvStatementParserImpl,
    OfxStatementParserImpl,
  ],
  exports: [PrismaImportRepository],
})
export class ImportsModule {}
