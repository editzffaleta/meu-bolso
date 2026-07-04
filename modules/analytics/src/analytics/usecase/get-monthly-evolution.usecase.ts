import { UseCase } from "@meubolso/shared";
import { TransactionRepository } from "@meubolso/transactions";
import { currentMonth, lastMonths, monthRange } from "../model";

export interface GetMonthlyEvolutionIn {
  userId: string;
  months?: number;
}

export interface MonthlyEvolutionOut {
  month: string;
  income: number;
  expense: number;
}

const DEFAULT_MONTHS = 6;

export class GetMonthlyEvolution
  implements UseCase<GetMonthlyEvolutionIn, MonthlyEvolutionOut[]>
{
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    input: GetMonthlyEvolutionIn,
  ): Promise<MonthlyEvolutionOut[]> {
    const monthsCount = input.months ?? DEFAULT_MONTHS;
    const months = lastMonths(monthsCount);

    const oldestMonth = months[0] ?? currentMonth();
    const newestMonth = months[months.length - 1] ?? currentMonth();

    const { from } = monthRange(oldestMonth);
    const { to } = monthRange(newestMonth);

    const summaries = await this.transactionRepository.sumByMonth(
      input.userId,
      from,
      to,
    );

    const summariesByMonth = new Map(
      summaries.map((summary) => [summary.month, summary]),
    );

    return months.map((month) => {
      const summary = summariesByMonth.get(month);

      return {
        month,
        income: summary?.income ?? 0,
        expense: summary?.expense ?? 0,
      };
    });
  }
}
