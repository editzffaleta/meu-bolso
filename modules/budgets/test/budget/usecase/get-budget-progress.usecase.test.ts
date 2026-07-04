import { Budget } from "../../../src/budget/model";
import { GetBudgetProgress } from "../../../src";
import { FakeBudgetRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_CATEGORY_ID = "33333333-3333-4333-8333-333333333333";

function buildBudget(categoryId: string, limitAmount: number, month = "2026-07"): Budget {
  return new Budget({
    categoryId,
    month,
    limitAmount,
    userId: USER_ID,
  });
}

describe("GetBudgetProgress", () => {
  it("deve retornar lista vazia quando o mes nao tem orcamentos", async () => {
    const budgetRepository = new FakeBudgetRepository();
    const useCase = new GetBudgetProgress(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([]);
  });

  it("deve retornar percent 0 quando nao ha gasto", async () => {
    const budget = buildBudget(CATEGORY_ID, 500);
    const budgetRepository = new FakeBudgetRepository([budget]);
    const useCase = new GetBudgetProgress(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([
      { categoryId: CATEGORY_ID, limit: 500, spent: 0, percent: 0 },
    ]);
  });

  it("deve calcular percent dentro do limite", async () => {
    const budget = buildBudget(CATEGORY_ID, 500);
    const budgetRepository = new FakeBudgetRepository([budget]);
    budgetRepository.setSpent(CATEGORY_ID, "2026-07", 250);
    const useCase = new GetBudgetProgress(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([
      { categoryId: CATEGORY_ID, limit: 500, spent: 250, percent: 50 },
    ]);
  });

  it("deve calcular percent exatamente 100%", async () => {
    const budget = buildBudget(CATEGORY_ID, 500);
    const budgetRepository = new FakeBudgetRepository([budget]);
    budgetRepository.setSpent(CATEGORY_ID, "2026-07", 500);
    const useCase = new GetBudgetProgress(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result[0].percent).toBe(100);
  });

  it("deve calcular percent de estouro (>100%)", async () => {
    const budget = buildBudget(CATEGORY_ID, 500);
    const budgetRepository = new FakeBudgetRepository([budget]);
    budgetRepository.setSpent(CATEGORY_ID, "2026-07", 750);
    const useCase = new GetBudgetProgress(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result[0].percent).toBe(150);
  });

  it("deve calcular o progresso de multiplos orcamentos do mes de forma independente", async () => {
    const budgetA = buildBudget(CATEGORY_ID, 500);
    const budgetB = buildBudget(OTHER_CATEGORY_ID, 200);
    const budgetRepository = new FakeBudgetRepository([budgetA, budgetB]);
    budgetRepository.setSpent(CATEGORY_ID, "2026-07", 100);
    budgetRepository.setSpent(OTHER_CATEGORY_ID, "2026-07", 200);
    const useCase = new GetBudgetProgress(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toHaveLength(2);
    expect(result.find((item) => item.categoryId === CATEGORY_ID)?.percent).toBe(
      20,
    );
    expect(
      result.find((item) => item.categoryId === OTHER_CATEGORY_ID)?.percent,
    ).toBe(100);
  });
});
