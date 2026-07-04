import { UseCase } from "@meubolso/shared";
import { BudgetRepository } from "../provider";

export interface GetBudgetProgressIn {
  userId: string;
  month: string;
}

export interface BudgetProgressOut {
  categoryId: string;
  limit: number;
  spent: number;
  percent: number;
}

export class GetBudgetProgress
  implements UseCase<GetBudgetProgressIn, BudgetProgressOut[]>
{
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: GetBudgetProgressIn): Promise<BudgetProgressOut[]> {
    const budgets = await this.budgetRepository.list(
      input.userId,
      input.month,
    );

    const progress: BudgetProgressOut[] = [];

    for (const budget of budgets) {
      const spent = await this.budgetRepository.sumSpentByCategory(
        input.userId,
        budget.categoryId,
        input.month,
      );

      const percent = Math.round((spent / budget.limitAmount) * 100);

      progress.push({
        categoryId: budget.categoryId,
        limit: budget.limitAmount,
        spent,
        percent,
      });
    }

    return progress;
  }
}
