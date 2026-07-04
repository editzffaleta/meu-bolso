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
  Budget,
  BudgetProgressOut,
  CreateBudget,
  DeleteBudget,
  GetBudgetProgress,
  ListBudgets,
  MONTH_PATTERN,
  UpdateBudget,
} from '@meubolso/budgets';
import { ValidationError, ValidationException } from '@meubolso/shared';
import { CurrentUser } from '../../shared/decorators';
import { PrismaCategoryRepository } from '../categories/category.prisma';
import { PrismaBudgetRepository } from './budget.prisma';

interface CreateBudgetBody {
  categoryId: string;
  month: string;
  limitAmount: number;
}

interface UpdateBudgetBody {
  categoryId?: string;
  month?: string;
  limitAmount?: number;
}

interface ListBudgetsQuery {
  month?: string;
}

interface ProgressQuery {
  month?: string;
}

@Controller('budgets')
export class BudgetsController {
  constructor(
    private readonly budgetRepository: PrismaBudgetRepository,
    private readonly categoryRepository: PrismaCategoryRepository,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateBudgetBody,
    @CurrentUser('id') userId: string,
  ): Promise<Budget> {
    const useCase = new CreateBudget(
      this.budgetRepository,
      this.categoryRepository,
    );

    return useCase.execute({
      categoryId: body.categoryId,
      month: body.month,
      limitAmount: body.limitAmount,
      userId,
    });
  }

  @Get('progress')
  async progress(
    @Query() query: ProgressQuery,
    @CurrentUser('id') userId: string,
  ): Promise<BudgetProgressOut[]> {
    const month = query.month ?? currentMonth();
    validateMonth(month);

    const useCase = new GetBudgetProgress(this.budgetRepository);

    return useCase.execute({ userId, month });
  }

  @Get()
  async list(
    @Query() query: ListBudgetsQuery,
    @CurrentUser('id') userId: string,
  ): Promise<Budget[]> {
    const useCase = new ListBudgets(this.budgetRepository);

    return useCase.execute({ userId, month: query.month });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateBudgetBody,
    @CurrentUser('id') userId: string,
  ): Promise<Budget> {
    const useCase = new UpdateBudget(
      this.budgetRepository,
      this.categoryRepository,
    );

    return useCase.execute({
      id,
      userId,
      categoryId: body.categoryId,
      month: body.month,
      limitAmount: body.limitAmount,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    const useCase = new DeleteBudget(this.budgetRepository);

    await useCase.execute({ id, userId });
  }
}

function currentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

function validateMonth(month: string): void {
  if (!MONTH_PATTERN.test(month)) {
    throw new ValidationException([new ValidationError('budget.month')]);
  }
}
