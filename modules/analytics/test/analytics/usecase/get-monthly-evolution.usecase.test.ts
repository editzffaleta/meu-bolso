import { Transaction } from "@meubolso/transactions";
import { GetMonthlyEvolution } from "../../../src";
import { lastMonths } from "../../../src/analytics/model";
import { FakeTransactionRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";

function buildTransaction(
  userId: string,
  type: "income" | "expense",
  amount: number,
  date: Date,
): Transaction {
  return new Transaction({
    date,
    description: "teste",
    type,
    amount,
    accountId: ACCOUNT_ID,
    source: "manual",
    fingerprint: `${userId}-${type}-${amount}-${date.getTime()}`,
    userId,
  });
}

describe("GetMonthlyEvolution", () => {
  it("deve retornar N meses zerados quando o usuario nao tem historico", async () => {
    const useCase = new GetMonthlyEvolution(new FakeTransactionRepository());

    const result = await useCase.execute({ userId: USER_ID, months: 6 });

    expect(result).toHaveLength(6);
    expect(result.every((item) => item.income === 0 && item.expense === 0)).toBe(true);
  });

  it("deve retornar os meses ordenados do mais antigo para o mais recente", async () => {
    const useCase = new GetMonthlyEvolution(new FakeTransactionRepository());
    const expectedMonths = lastMonths(3);

    const result = await useCase.execute({ userId: USER_ID, months: 3 });

    expect(result.map((item) => item.month)).toEqual(expectedMonths);
  });

  it("deve somar receitas e despesas do mes atual", async () => {
    const now = new Date();
    const dateInCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10));

    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 500, dateInCurrentMonth),
      buildTransaction(USER_ID, "expense", 200, dateInCurrentMonth),
    ]);
    const useCase = new GetMonthlyEvolution(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID, months: 6 });
    const currentMonthEntry = result[result.length - 1];

    expect(currentMonthEntry.income).toBe(500);
    expect(currentMonthEntry.expense).toBe(200);
  });

  it("nao deve considerar transacoes de outro usuario (isolamento)", async () => {
    const now = new Date();
    const dateInCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10));

    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(OTHER_USER_ID, "income", 9999, dateInCurrentMonth),
    ]);
    const useCase = new GetMonthlyEvolution(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID, months: 6 });

    expect(result.every((item) => item.income === 0)).toBe(true);
  });

  it("deve usar 6 meses como padrao quando months nao informado", async () => {
    const useCase = new GetMonthlyEvolution(new FakeTransactionRepository());

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toHaveLength(6);
  });
});
