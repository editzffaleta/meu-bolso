import { DomainError, NotFoundError, UseCase } from "@meubolso/shared";
import { CategoryRepository } from "@meubolso/categories";
import { Budget } from "../model";
import { BudgetRepository } from "../provider";

export interface UpdateBudgetIn {
  id: string;
  userId: string;
  categoryId?: string;
  month?: string;
  limitAmount?: number;
}

export class UpdateBudget implements UseCase<UpdateBudgetIn, Budget> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: UpdateBudgetIn): Promise<Budget> {
    const existing = await this.budgetRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("budget.not.found");
    }

    const categoryId = input.categoryId ?? existing.categoryId;
    const month = input.month ?? existing.month;
    const limitAmount = input.limitAmount ?? existing.limitAmount;

    if (input.categoryId) {
      const category = await this.categoryRepository.findById(
        input.categoryId,
        input.userId,
      );

      if (!category) {
        throw new NotFoundError("budget.category.not.found");
      }
    }

    if (categoryId !== existing.categoryId || month !== existing.month) {
      const duplicate = await this.budgetRepository.findByCategoryAndMonth(
        input.userId,
        categoryId,
        month,
      );

      if (duplicate && duplicate.id !== existing.id) {
        throw new DomainError("budget.already.exists", 409);
      }
    }

    const updated = existing.clone({
      categoryId,
      month,
      limitAmount,
    });

    updated.validate();

    return this.budgetRepository.update(updated);
  }
}
