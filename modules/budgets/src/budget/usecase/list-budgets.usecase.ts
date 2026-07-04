import { UseCase } from "@meubolso/shared";
import { Budget } from "../model";
import { BudgetRepository } from "../provider";

export interface ListBudgetsIn {
  userId: string;
  month?: string;
}

export class ListBudgets implements UseCase<ListBudgetsIn, Budget[]> {
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: ListBudgetsIn): Promise<Budget[]> {
    return this.budgetRepository.list(input.userId, input.month);
  }
}
