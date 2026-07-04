import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  Account,
  CreateAccount,
  DeleteAccount,
  FindAccountById,
  ListAccounts,
  UpdateAccount,
  type AccountType,
} from '@meubolso/accounts';
import { CurrentUser } from '../../shared/decorators';
import { PrismaAccountRepository } from './account.prisma';

interface CreateAccountBody {
  name: string;
  type: AccountType;
  institution?: string;
  initialBalance?: number;
}

interface UpdateAccountBody {
  name?: string;
  type?: AccountType;
  institution?: string;
  initialBalance?: number;
}

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountRepository: PrismaAccountRepository) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateAccountBody,
    @CurrentUser('id') userId: string,
  ): Promise<Account> {
    const useCase = new CreateAccount(this.accountRepository);

    return useCase.execute({ ...body, userId });
  }

  @Get()
  async list(@CurrentUser('id') userId: string): Promise<Account[]> {
    const useCase = new ListAccounts(this.accountRepository);

    return useCase.execute({ userId });
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Account> {
    const useCase = new FindAccountById(this.accountRepository);

    return useCase.execute({ id, userId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAccountBody,
    @CurrentUser('id') userId: string,
  ): Promise<Account> {
    const useCase = new UpdateAccount(this.accountRepository);

    return useCase.execute({ ...body, id, userId });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    const useCase = new DeleteAccount(this.accountRepository);

    await useCase.execute({ id, userId });
  }
}
