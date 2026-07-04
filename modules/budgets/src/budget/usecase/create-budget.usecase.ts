import { DomainError, NotFoundError, UseCase } from "@meubolso/shared";
import { CategoryRepository } from "@meubolso/categories";
import { Budget } from "../model";
import { BudgetRepository } from "../provider";

export interface CreateBudgetIn {
  categoryId: string;
  month: string;
  limitAmount: number;
  userId: string;
}

export class CreateBudget implements UseCase<CreateBudgetIn, Budget> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: CreateBudgetIn): Promise<Budget> {
    const category = await this.categoryRepository.findById(
      input.categoryId,
      input.userId,
    );

    if (!category) {
      throw new NotFoundError("budget.category.not.found");
    }

    const existing = await this.budgetRepository.findByCategoryAndMonth(
      input.userId,
      input.categoryId,
      input.month,
    );

    if (existing) {
      throw new DomainError("budget.already.exists", 409);
    }

    const budget = new Budget({
      categoryId: input.categoryId,
      month: input.month,
      limitAmount: input.limitAmount,
      userId: input.userId,
    });

    budget.validate();

    return this.budgetRepository.create(budget);
  }
}
