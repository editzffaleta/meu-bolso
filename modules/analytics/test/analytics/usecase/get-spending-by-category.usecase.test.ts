import { Category } from "@meubolso/categories";
import { Transaction } from "@meubolso/transactions";
import { GetSpendingByCategory } from "../../../src";
import { FakeCategoryRepository, FakeTransactionRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const CATEGORY_FOOD_ID = "33333333-3333-4333-8333-333333333333";
const CATEGORY_TRANSPORT_ID = "44444444-4444-4444-8444-444444444444";

function buildTransaction(
  userId: string,
  type: "income" | "expense",
  amount: number,
  date: Date,
  categoryId?: string | null,
): Transaction {
  return new Transaction({
    date,
    description: "teste",
    type,
    amount,
    accountId: ACCOUNT_ID,
    categoryId,
    source: "manual",
    fingerprint: `${userId}-${type}-${amount}-${date.getTime()}-${categoryId ?? "none"}`,
    userId,
  });
}

function buildCategory(id: string, name: string, color: string): Category {
  return new Category({
    id,
    name,
    type: "expense",
    color,
    userId: USER_ID,
    isDefault: false,
  });
}

describe("GetSpendingByCategory", () => {
  it("deve retornar lista vazia quando o mes nao tem despesas", async () => {
    const useCase = new GetSpendingByCategory(
      new FakeTransactionRepository(),
      new FakeCategoryRepository(),
    );

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([]);
  });

  it("deve agrupar despesas por categoria com nome e cor, ordenado por total decrescente", async () => {
    const categoryRepository = new FakeCategoryRepository([
      buildCategory(CATEGORY_FOOD_ID, "Alimentação", "#EF4444"),
      buildCategory(CATEGORY_TRANSPORT_ID, "Transporte", "#3B82F6"),
    ]);
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "expense", 100, new Date("2026-07-05T12:00:00Z"), CATEGORY_TRANSPORT_ID),
      buildTransaction(USER_ID, "expense", 200, new Date("2026-07-10T12:00:00Z"), CATEGORY_FOOD_ID),
      buildTransaction(USER_ID, "expense", 150, new Date("2026-07-15T12:00:00Z"), CATEGORY_FOOD_ID),
    ]);
    const useCase = new GetSpendingByCategory(transactionRepository, categoryRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([
      { categoryId: CATEGORY_FOOD_ID, name: "Alimentação", color: "#EF4444", total: 350 },
      { categoryId: CATEGORY_TRANSPORT_ID, name: "Transporte", color: "#3B82F6", total: 100 },
    ]);
  });

  it("deve agrupar transacoes sem categoria como Sem categoria", async () => {
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "expense", 80, new Date("2026-07-05T12:00:00Z"), null),
    ]);
    const useCase = new GetSpendingByCategory(
      transactionRepository,
      new FakeCategoryRepository(),
    );

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([
      { categoryId: null, name: "Sem categoria", color: "#9CA3AF", total: 80 },
    ]);
  });

  it("nao deve incluir receitas na soma", async () => {
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 1000, new Date("2026-07-05T12:00:00Z"), CATEGORY_FOOD_ID),
    ]);
    const useCase = new GetSpendingByCategory(
      transactionRepository,
      new FakeCategoryRepository([buildCategory(CATEGORY_FOOD_ID, "Alimentação", "#EF4444")]),
    );

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([]);
  });

  it("nao deve considerar transacoes de outro usuario (isolamento)", async () => {
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(OTHER_USER_ID, "expense", 999, new Date("2026-07-05T12:00:00Z"), CATEGORY_FOOD_ID),
    ]);
    const useCase = new GetSpendingByCategory(
      transactionRepository,
      new FakeCategoryRepository(),
    );

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual([]);
  });
});
