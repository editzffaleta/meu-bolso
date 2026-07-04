import { NotFoundError, UseCase } from "@meubolso/shared";
import { BudgetRepository } from "../provider";

export interface DeleteBudgetIn {
  id: string;
  userId: string;
}

export class DeleteBudget implements UseCase<DeleteBudgetIn, void> {
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: DeleteBudgetIn): Promise<void> {
    const existing = await this.budgetRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("budget.not.found");
    }

    await this.budgetRepository.delete(input.id, input.userId);
  }
}
