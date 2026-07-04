import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AccountsController } from './accounts.controller';
import { PrismaAccountRepository } from './account.prisma';

@Module({
  imports: [DbModule],
  controllers: [AccountsController],
  providers: [PrismaAccountRepository],
  exports: [PrismaAccountRepository],
})
export class AccountsModule {}
