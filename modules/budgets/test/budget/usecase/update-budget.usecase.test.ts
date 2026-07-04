import { DomainError, NotFoundError } from "@meubolso/shared";
import { Category } from "@meubolso/categories";
import { Budget } from "../../../src/budget/model";
import { UpdateBudget } from "../../../src";
import { FakeBudgetRepository, FakeCategoryRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";

function buildCategory(overrides: Partial<{ userId: string }> = {}): Category {
  return new Category({
    name: "Mercado",
    type: "expense",
    color: "#059669",
    userId: overrides.userId ?? USER_ID,
    isDefault: false,
  });
}

function buildBudget(
  categoryId: string,
  overrides: Partial<{ userId: string; month: string; limitAmount: number }> = {},
): Budget {
  return new Budget({
    categoryId,
    month: overrides.month ?? "2026-07",
    limitAmount: overrides.limitAmount ?? 500,
    userId: overrides.userId ?? USER_ID,
  });
}

describe("UpdateBudget", () => {
  it("deve atualizar o limitAmount no caminho feliz", async () => {
    const category = buildCategory();
    const budget = buildBudget(category.id);
    const budgetRepository = new FakeBudgetRepository([budget]);
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateBudget(budgetRepository, categoryRepository);

    const updated = await useCase.execute({
      id: budget.id,
      userId: USER_ID,
      limitAmount: 900,
    });

    expect(updated.limitAmount).toBe(900);
  });

  it("deve rejeitar orcamento inexistente com NotFoundError", async () => {
    const budgetRepository = new FakeBudgetRepository();
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        id: "33333333-3333-4333-8333-333333333333",
        userId: USER_ID,
        limitAmount: 900,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar orcamento de outro usuario com NotFoundError", async () => {
    const category = buildCategory({ userId: OTHER_USER_ID });
    const budget = buildBudget(category.id, { userId: OTHER_USER_ID });
    const budgetRepository = new FakeBudgetRepository([budget]);
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        id: budget.id,
        userId: USER_ID,
        limitAmount: 900,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar nova categoryId de outro usuario com NotFoundError", async () => {
    const category = buildCategory();
    const otherUserCategory = buildCategory({ userId: OTHER_USER_ID });
    const budget = buildBudget(category.id);
    const budgetRepository = new FakeBudgetRepository([budget]);
    const categoryRepository = new FakeCategoryRepository([
      category,
      otherUserCategory,
    ]);
    const useCase = new UpdateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        id: budget.id,
        userId: USER_ID,
        categoryId: otherUserCategory.id,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve permitir alterar month para um trio livre, sem colisao", async () => {
    const category = buildCategory();
    const budget = buildBudget(category.id, { month: "2026-07" });
    const budgetRepository = new FakeBudgetRepository([budget]);
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateBudget(budgetRepository, categoryRepository);

    const updated = await useCase.execute({
      id: budget.id,
      userId: USER_ID,
      month: "2026-08",
    });

    expect(updated.month).toBe("2026-08");
  });

  it("deve rejeitar alteracao que colida com trio ja existente com DomainError 409", async () => {
    const category = buildCategory();
    const budgetA = buildBudget(category.id, { month: "2026-07" });
    const budgetB = buildBudget(category.id, { month: "2026-08" });
    const budgetRepository = new FakeBudgetRepository([budgetA, budgetB]);
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        id: budgetB.id,
        userId: USER_ID,
        month: "2026-07",
      }),
    ).rejects.toThrow(DomainError);
  });
});
