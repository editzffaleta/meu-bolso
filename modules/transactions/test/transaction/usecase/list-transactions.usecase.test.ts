import { ListTransactions, Transaction } from "../../../src";
import { FakeTransactionRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_ACCOUNT_ID = "44444444-4444-4444-8444-444444444444";
const CATEGORY_ID = "33333333-3333-4333-8333-333333333333";

function buildTransaction(
  overrides: Partial<{
    date: Date;
    type: "income" | "expense";
    accountId: string;
    categoryId?: string;
    userId: string;
  }> = {},
): Transaction {
  return new Transaction({
    date: overrides.date ?? new Date("2026-01-10T00:00:00.000Z"),
    description: "Transacao",
    type: overrides.type ?? "expense",
    amount: 100,
    accountId: overrides.accountId ?? ACCOUNT_ID,
    categoryId: overrides.categoryId,
    source: "manual",
    fingerprint: Math.random().toString(),
    userId: overrides.userId ?? USER_ID,
  });
}

describe("ListTransactions", () => {
  it("deve listar apenas transacoes do usuario informado", async () => {
    const mine = buildTransaction();
    const others = buildTransaction({ userId: OTHER_USER_ID });
    const transactionRepository = new FakeTransactionRepository([
      mine,
      others,
    ]);
    const useCase = new ListTransactions(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(mine.id);
    expect(result.total).toBe(1);
  });

  it("deve aplicar filtro de periodo (from/to)", async () => {
    const inRange = buildTransaction({ date: new Date("2026-01-15") });
    const before = buildTransaction({ date: new Date("2025-12-01") });
    const after = buildTransaction({ date: new Date("2026-03-01") });
    const transactionRepository = new FakeTransactionRepository([
      inRange,
      before,
      after,
    ]);
    const useCase = new ListTransactions(transactionRepository);

    const result = await useCase.execute({
      userId: USER_ID,
      from: new Date("2026-01-01"),
      to: new Date("2026-01-31"),
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(inRange.id);
  });

  it("deve aplicar filtro de accountId", async () => {
    const matching = buildTransaction({ accountId: ACCOUNT_ID });
    const other = buildTransaction({ accountId: OTHER_ACCOUNT_ID });
    const transactionRepository = new FakeTransactionRepository([
      matching,
      other,
    ]);
    const useCase = new ListTransactions(transactionRepository);

    const result = await useCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(matching.id);
  });

  it("deve aplicar filtro de categoryId", async () => {
    const matching = buildTransaction({ categoryId: CATEGORY_ID });
    const other = buildTransaction({ categoryId: undefined });
    const transactionRepository = new FakeTransactionRepository([
      matching,
      other,
    ]);
    const useCase = new ListTransactions(transactionRepository);

    const result = await useCase.execute({
      userId: USER_ID,
      categoryId: CATEGORY_ID,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(matching.id);
  });

  it("deve aplicar filtro de type", async () => {
    const income = buildTransaction({ type: "income" });
    const expense = buildTransaction({ type: "expense" });
    const transactionRepository = new FakeTransactionRepository([
      income,
      expense,
    ]);
    const useCase = new ListTransactions(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID, type: "income" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(income.id);
  });

  it("deve paginar com defaults (page 1, pageSize 20)", async () => {
    const transactions = Array.from({ length: 5 }, () => buildTransaction());
    const transactionRepository = new FakeTransactionRepository(transactions);
    const useCase = new ListTransactions(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(5);
  });

  it("deve paginar corretamente com mais itens que pageSize", async () => {
    const transactions = Array.from({ length: 25 }, () => buildTransaction());
    const transactionRepository = new FakeTransactionRepository(transactions);
    const useCase = new ListTransactions(transactionRepository);

    const firstPage = await useCase.execute({
      userId: USER_ID,
      page: 1,
      pageSize: 10,
    });
    const secondPage = await useCase.execute({
      userId: USER_ID,
      page: 2,
      pageSize: 10,
    });
    const thirdPage = await useCase.execute({
      userId: USER_ID,
      page: 3,
      pageSize: 10,
    });

    expect(firstPage.items).toHaveLength(10);
    expect(secondPage.items).toHaveLength(10);
    expect(thirdPage.items).toHaveLength(5);
    expect(firstPage.total).toBe(25);
  });

  it("deve clampar pageSize acima de 100 para 100", async () => {
    const transactions = Array.from({ length: 5 }, () => buildTransaction());
    const transactionRepository = new FakeTransactionRepository(transactions);
    const useCase = new ListTransactions(transactionRepository);

    const result = await useCase.execute({
      userId: USER_ID,
      pageSize: 500,
    });

    expect(result.pageSize).toBe(100);
  });
});
