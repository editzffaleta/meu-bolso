import { NotFoundError } from "@meubolso/shared";
import { Budget } from "../../../src/budget/model";
import { DeleteBudget } from "../../../src";
import { FakeBudgetRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

describe("DeleteBudget", () => {
  it("deve excluir o orcamento no caminho feliz", async () => {
    const budget = new Budget({
      categoryId: CATEGORY_ID,
      month: "2026-07",
      limitAmount: 500,
      userId: USER_ID,
    });
    const budgetRepository = new FakeBudgetRepository([budget]);
    const useCase = new DeleteBudget(budgetRepository);

    await useCase.execute({ id: budget.id, userId: USER_ID });

    expect(budgetRepository.budgets).toHaveLength(0);
  });

  it("deve rejeitar orcamento inexistente com NotFoundError", async () => {
    const budgetRepository = new FakeBudgetRepository();
    const useCase = new DeleteBudget(budgetRepository);

    await expect(
      useCase.execute({
        id: "33333333-3333-4333-8333-333333333333",
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar orcamento de outro usuario com NotFoundError, sem excluir", async () => {
    const budget = new Budget({
      categoryId: CATEGORY_ID,
      month: "2026-07",
      limitAmount: 500,
      userId: OTHER_USER_ID,
    });
    const budgetRepository = new FakeBudgetRepository([budget]);
    const useCase = new DeleteBudget(budgetRepository);

    await expect(
      useCase.execute({ id: budget.id, userId: USER_ID }),
    ).rejects.toThrow(NotFoundError);

    expect(budgetRepository.budgets).toHaveLength(1);
  });
});
