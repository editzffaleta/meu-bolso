import { Account } from "@meubolso/accounts";
import { Transaction } from "@meubolso/transactions";
import { GetConsolidatedBalance } from "../../../src";
import { FakeAccountRepository, FakeTransactionRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_ACCOUNT_ID = "33333333-3333-4333-8333-333333333333";

function buildAccount(userId: string, initialBalance: number): Account {
  return new Account({
    name: "conta teste",
    type: "checking",
    initialBalance,
    userId,
  });
}

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

describe("GetConsolidatedBalance", () => {
  it("deve retornar zero quando o usuario nao tem contas nem transacoes", async () => {
    const accountRepository = new FakeAccountRepository();
    const transactionRepository = new FakeTransactionRepository();
    const useCase = new GetConsolidatedBalance(
      accountRepository,
      transactionRepository,
    );

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ balance: 0 });
  });

  it("deve somar o saldo inicial de todas as contas com receitas e despesas de todas as transacoes", async () => {
    const accountRepository = new FakeAccountRepository([
      buildAccount(USER_ID, 1000),
      buildAccount(USER_ID, 500),
    ]);
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 300, new Date("2026-01-05T12:00:00Z")),
      buildTransaction(USER_ID, "income", 200, new Date("2026-06-10T12:00:00Z")),
      buildTransaction(USER_ID, "expense", 150, new Date("2026-06-20T12:00:00Z")),
    ]);
    const useCase = new GetConsolidatedBalance(
      accountRepository,
      transactionRepository,
    );

    const result = await useCase.execute({ userId: USER_ID });

    // 1000 + 500 (saldo inicial) + 300 + 200 (receitas) - 150 (despesa) = 1850
    expect(result).toEqual({ balance: 1850 });
  });

  it("deve considerar transacoes de todos os meses (all-time), nao so o mes corrente", async () => {
    const accountRepository = new FakeAccountRepository([
      buildAccount(USER_ID, 0),
    ]);
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 1000, new Date("2020-01-01T12:00:00Z")),
      buildTransaction(USER_ID, "expense", 400, new Date("2021-05-01T12:00:00Z")),
    ]);
    const useCase = new GetConsolidatedBalance(
      accountRepository,
      transactionRepository,
    );

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ balance: 600 });
  });

  it("nao deve considerar contas e transacoes de outro usuario (isolamento)", async () => {
    const accountRepository = new FakeAccountRepository([
      buildAccount(USER_ID, 100),
      buildAccount(OTHER_USER_ID, 99999),
    ]);
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 50, new Date("2026-07-01T12:00:00Z")),
      buildTransaction(
        OTHER_USER_ID,
        "income",
        99999,
        new Date("2026-07-01T12:00:00Z"),
      ),
    ]);
    const useCase = new GetConsolidatedBalance(
      accountRepository,
      transactionRepository,
    );

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ balance: 150 });
  });

  it("deve arredondar o saldo com precisao exata mesmo com valores propensos a erro de ponto flutuante", async () => {
    const accountRepository = new FakeAccountRepository([
      buildAccount(USER_ID, 0.1),
      buildAccount(USER_ID, 0.2),
    ]);
    const transactionRepository = new FakeTransactionRepository([
      buildTransaction(USER_ID, "income", 10.1, new Date("2026-01-01T12:00:00Z")),
      buildTransaction(USER_ID, "income", 20.2, new Date("2026-02-01T12:00:00Z")),
      buildTransaction(USER_ID, "expense", 0.1, new Date("2026-03-01T12:00:00Z")),
      buildTransaction(USER_ID, "expense", 0.2, new Date("2026-04-01T12:00:00Z")),
    ]);
    const useCase = new GetConsolidatedBalance(
      accountRepository,
      transactionRepository,
    );

    const result = await useCase.execute({ userId: USER_ID });

    // 0.1 + 0.2 (saldo inicial) + 10.1 + 20.2 (receitas) - 0.1 - 0.2 (despesas)
    // = 30.3 (sem arredondamento a soma float ingenua daria 30.299999999999997)
    expect(result.balance).toBe(30.3);
  });

  it("nao deve quebrar quando ha contas de outros tipos e sem transacoes", async () => {
    const accountRepository = new FakeAccountRepository([
      buildAccount(USER_ID, 250),
    ]);
    const transactionRepository = new FakeTransactionRepository();
    const useCase = new GetConsolidatedBalance(
      accountRepository,
      transactionRepository,
    );

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ balance: 250 });
  });
});
