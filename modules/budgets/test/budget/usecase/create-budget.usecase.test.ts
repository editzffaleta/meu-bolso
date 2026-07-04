import { DomainError, NotFoundError, ValidationException } from "@meubolso/shared";
import { Category } from "@meubolso/categories";
import { CreateBudget } from "../../../src";
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

describe("CreateBudget", () => {
  it("deve criar e persistir o orcamento no caminho feliz", async () => {
    const category = buildCategory();
    const budgetRepository = new FakeBudgetRepository();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new CreateBudget(budgetRepository, categoryRepository);

    const budget = await useCase.execute({
      categoryId: category.id,
      month: "2026-07",
      limitAmount: 500,
      userId: USER_ID,
    });

    expect(budget.month).toBe("2026-07");
    expect(budget.limitAmount).toBe(500);
    expect(budgetRepository.budgets).toHaveLength(1);
  });

  it("deve rejeitar categoryId de outro usuario com NotFoundError, sem persistir", async () => {
    const otherUserCategory = buildCategory({ userId: OTHER_USER_ID });
    const budgetRepository = new FakeBudgetRepository();
    const categoryRepository = new FakeCategoryRepository([
      otherUserCategory,
    ]);
    const useCase = new CreateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        categoryId: otherUserCategory.id,
        month: "2026-07",
        limitAmount: 500,
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(budgetRepository.budgets).toHaveLength(0);
  });

  it("deve rejeitar categoryId inexistente com NotFoundError", async () => {
    const budgetRepository = new FakeBudgetRepository();
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        categoryId: "33333333-3333-4333-8333-333333333333",
        month: "2026-07",
        limitAmount: 500,
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar duplicata do trio (userId, categoryId, month) com DomainError 409", async () => {
    const category = buildCategory();
    const budgetRepository = new FakeBudgetRepository();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new CreateBudget(budgetRepository, categoryRepository);

    await useCase.execute({
      categoryId: category.id,
      month: "2026-07",
      limitAmount: 500,
      userId: USER_ID,
    });

    await expect(
      useCase.execute({
        categoryId: category.id,
        month: "2026-07",
        limitAmount: 300,
        userId: USER_ID,
      }),
    ).rejects.toThrow(DomainError);

    expect(budgetRepository.budgets).toHaveLength(1);
  });

  it("deve rejeitar limitAmount <= 0 com ValidationException, sem persistir", async () => {
    const category = buildCategory();
    const budgetRepository = new FakeBudgetRepository();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new CreateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        categoryId: category.id,
        month: "2026-07",
        limitAmount: -10,
        userId: USER_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(budgetRepository.budgets).toHaveLength(0);
  });

  it("deve rejeitar month em formato invalido com ValidationException", async () => {
    const category = buildCategory();
    const budgetRepository = new FakeBudgetRepository();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new CreateBudget(budgetRepository, categoryRepository);

    await expect(
      useCase.execute({
        categoryId: category.id,
        month: "2026-13",
        limitAmount: 500,
        userId: USER_ID,
      }),
    ).rejects.toThrow(ValidationException);
  });
});
