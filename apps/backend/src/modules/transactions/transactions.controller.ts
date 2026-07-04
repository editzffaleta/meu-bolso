import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateTransaction,
  DeleteTransaction,
  GetTransaction,
  ListTransactions,
  ListTransactionsOut,
  Transaction,
  UpdateTransaction,
  type TransactionType,
} from '@meubolso/transactions';
import { CurrentUser } from '../../shared/decorators';
import { PrismaAccountRepository } from '../accounts/account.prisma';
import { PrismaCategoryRepository } from '../categories/category.prisma';
import { PrismaTransactionRepository } from './transaction.prisma';

interface CreateTransactionBody {
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string;
}

interface UpdateTransactionBody {
  date?: string;
  description?: string;
  type?: TransactionType;
  amount?: number;
  accountId?: string;
  categoryId?: string | null;
}

interface ListTransactionsQuery {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  page?: string;
  pageSize?: string;
}

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionRepository: PrismaTransactionRepository,
    private readonly accountRepository: PrismaAccountRepository,
    private readonly categoryRepository: PrismaCategoryRepository,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateTransactionBody,
    @CurrentUser('id') userId: string,
  ): Promise<Transaction> {
    const useCase = new CreateTransaction(
      this.transactionRepository,
      this.accountRepository,
      this.categoryRepository,
    );

    return useCase.execute({
      date: new Date(body.date),
      description: body.description,
      type: body.type,
      amount: body.amount,
      accountId: body.accountId,
      categoryId: body.categoryId,
      userId,
    });
  }

  @Get()
  async list(
    @Query() query: ListTransactionsQuery,
    @CurrentUser('id') userId: string,
  ): Promise<ListTransactionsOut> {
    const useCase = new ListTransactions(this.transactionRepository);

    return useCase.execute({
      userId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      accountId: query.accountId,
      categoryId: query.categoryId,
      type: query.type,
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    });
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Transaction> {
    const useCase = new GetTransaction(this.transactionRepository);

    return useCase.execute({ id, userId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTransactionBody,
    @CurrentUser('id') userId: string,
  ): Promise<Transaction> {
    const useCase = new UpdateTransaction(
      this.transactionRepository,
      this.accountRepository,
      this.categoryRepository,
    );

    return useCase.execute({
      id,
      userId,
      date: body.date ? new Date(body.date) : undefined,
      description: body.description,
      type: body.type,
      amount: body.amount,
      accountId: body.accountId,
      categoryId: body.categoryId,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    const useCase = new DeleteTransaction(this.transactionRepository);

    await useCase.execute({ id, userId });
  }
}
