import { Budget } from "../../../src/budget/model";
import { ListBudgets } from "../../../src";
import { FakeBudgetRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

function buildBudget(
  overrides: Partial<{ userId: string; month: string }> = {},
): Budget {
  return new Budget({
    categoryId: CATEGORY_ID,
    month: overrides.month ?? "2026-07",
    limitAmount: 500,
    userId: overrides.userId ?? USER_ID,
  });
}

describe("ListBudgets", () => {
  it("deve listar apenas os orcamentos do usuario", async () => {
    const own = buildBudget();
    const other = buildBudget({ userId: OTHER_USER_ID });
    const budgetRepository = new FakeBudgetRepository([own, other]);
    const useCase = new ListBudgets(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(own.id);
  });

  it("deve filtrar por mes quando informado", async () => {
    const julyBudget = buildBudget({ month: "2026-07" });
    const augustBudget = buildBudget({ month: "2026-08" });
    const budgetRepository = new FakeBudgetRepository([
      julyBudget,
      augustBudget,
    ]);
    const useCase = new ListBudgets(budgetRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-08" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(augustBudget.id);
  });
});
