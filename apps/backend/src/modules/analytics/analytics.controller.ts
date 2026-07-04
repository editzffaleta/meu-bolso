import { Controller, Get, Query } from '@nestjs/common';
import {
  ConsolidatedBalanceOut,
  GetConsolidatedBalance,
  GetMonthlyEvolution,
  GetSpendingByCategory,
  GetSummary,
  MonthlyEvolutionOut,
  MONTH_PATTERN,
  SpendingByCategoryOut,
  SummaryOut,
  currentMonth,
} from '@meubolso/analytics';
import { ValidationError, ValidationException } from '@meubolso/shared';
import { CurrentUser } from '../../shared/decorators';
import { PrismaAccountRepository } from '../accounts/account.prisma';
import { PrismaCategoryRepository } from '../categories/category.prisma';
import { PrismaTransactionRepository } from '../transactions/transaction.prisma';

interface SummaryQuery {
  month?: string;
}

interface SpendingByCategoryQuery {
  month?: string;
}

interface MonthlyEvolutionQuery {
  months?: string;
}

const DEFAULT_EVOLUTION_MONTHS = 6;
const MAX_EVOLUTION_MONTHS = 24;

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly transactionRepository: PrismaTransactionRepository,
    private readonly categoryRepository: PrismaCategoryRepository,
    private readonly accountRepository: PrismaAccountRepository,
  ) {}

  @Get('summary')
  async summary(
    @Query() query: SummaryQuery,
    @CurrentUser('id') userId: string,
  ): Promise<SummaryOut> {
    const month = query.month ?? currentMonth();
    validateMonth(month);

    const useCase = new GetSummary(this.transactionRepository);

    return useCase.execute({ userId, month });
  }

  @Get('spending-by-category')
  async spendingByCategory(
    @Query() query: SpendingByCategoryQuery,
    @CurrentUser('id') userId: string,
  ): Promise<SpendingByCategoryOut[]> {
    const month = query.month ?? currentMonth();
    validateMonth(month);

    const useCase = new GetSpendingByCategory(
      this.transactionRepository,
      this.categoryRepository,
    );

    return useCase.execute({ userId, month });
  }

  @Get('monthly-evolution')
  async monthlyEvolution(
    @Query() query: MonthlyEvolutionQuery,
    @CurrentUser('id') userId: string,
  ): Promise<MonthlyEvolutionOut[]> {
    const months = parseMonths(query.months);

    const useCase = new GetMonthlyEvolution(this.transactionRepository);

    return useCase.execute({ userId, months });
  }

  @Get('consolidated-balance')
  async consolidatedBalance(
    @CurrentUser('id') userId: string,
  ): Promise<ConsolidatedBalanceOut> {
    const useCase = new GetConsolidatedBalance(
      this.accountRepository,
      this.transactionRepository,
    );

    return useCase.execute({ userId });
  }
}

function validateMonth(month: string): void {
  if (!MONTH_PATTERN.test(month)) {
    throw new ValidationException([new ValidationError('analytics.month')]);
  }
}

function parseMonths(raw?: string): number {
  if (raw === undefined) {
    return DEFAULT_EVOLUTION_MONTHS;
  }

  const months = Number(raw);

  if (
    !Number.isInteger(months) ||
    months < 1 ||
    months > MAX_EVOLUTION_MONTHS
  ) {
    throw new ValidationException([new ValidationError('analytics.months')]);
  }

  return months;
}
