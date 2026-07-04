import { Transaction } from "@meubolso/transactions";
import { GetSummary } from "../../../src";
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

describe("GetSummary", () => {
  it("deve retornar zerado quando o mes nao tem transacoes", async () => {
    const transactionRepository = new FakeTransactionRepository();
    const useCase = new GetSummary(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    });
  });

  it("deve somar receitas e despesas do mes e calcular o saldo", async () => {
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 1000, new Date("2026-07-05T12:00:00Z")),
      buildTransaction(USER_ID, "expense", 300, new Date("2026-07-10T12:00:00Z")),
      buildTransaction(USER_ID, "expense", 200, new Date("2026-07-20T12:00:00Z")),
    ]);
    const useCase = new GetSummary(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual({
      totalIncome: 1000,
      totalExpense: 500,
      balance: 500,
      transactionCount: 3,
    });
  });

  it("nao deve considerar transacoes de outro mes", async () => {
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 1000, new Date("2026-06-05T12:00:00Z")),
    ]);
    const useCase = new GetSummary(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result.transactionCount).toBe(0);
  });

  it("nao deve considerar transacoes de outro usuario (isolamento)", async () => {
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(OTHER_USER_ID, "income", 5000, new Date("2026-07-05T12:00:00Z")),
    ]);
    const useCase = new GetSummary(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID, month: "2026-07" });

    expect(result).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    });
  });

  it("deve usar o mes atual quando nao informado", async () => {
    const transactionRepository = new FakeTransactionRepository();
    const useCase = new GetSummary(transactionRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.transactionCount).toBe(0);
  });
});
