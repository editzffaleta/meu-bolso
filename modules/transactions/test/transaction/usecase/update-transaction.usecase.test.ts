import { NotFoundError, ValidationException } from "@meubolso/shared";
import { Account } from "@meubolso/accounts";
import { Category } from "@meubolso/categories";
import { Transaction } from "../../../src";
import { UpdateTransaction } from "../../../src";
import {
  FakeAccountRepository,
  FakeCategoryRepository,
  FakeTransactionRepository,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";

function buildAccount(userId = USER_ID): Account {
  return new Account({
    name: "Carteira",
    type: "wallet",
    initialBalance: 0,
    userId,
  });
}

function buildCategory(userId = USER_ID): Category {
  return new Category({
    name: "Mercado",
    type: "expense",
    color: "#059669",
    userId,
    isDefault: false,
  });
}

function buildTransaction(overrides: Partial<{ accountId: string; userId: string }> = {}): Transaction {
  return new Transaction({
    date: new Date("2026-01-10T00:00:00.000Z"),
    description: "Mercado",
    type: "expense",
    amount: 150.5,
    accountId: overrides.accountId ?? buildAccount().id,
    source: "manual",
    fingerprint: "abc123",
    userId: overrides.userId ?? USER_ID,
  });
}

describe("UpdateTransaction", () => {
  it("deve atualizar a transacao no caminho feliz", async () => {
    const account = buildAccount();
    const transaction = buildTransaction({ accountId: account.id });
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    const updated = await useCase.execute({
      id: transaction.id,
      userId: USER_ID,
      description: "Mercado atualizado",
      amount: 200,
    });

    expect(updated.description).toBe("Mercado atualizado");
    expect(updated.amount).toBe(200);
  });

  it("deve rejeitar id inexistente com NotFoundError", async () => {
    const transactionRepository = new FakeTransactionRepository();
    const accountRepository = new FakeAccountRepository();
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: "00000000-0000-4000-8000-000000000000",
        userId: USER_ID,
        description: "Novo",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar transacao de outro usuario com NotFoundError", async () => {
    const account = buildAccount(OTHER_USER_ID);
    const transaction = buildTransaction({
      accountId: account.id,
      userId: OTHER_USER_ID,
    });
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: transaction.id,
        userId: USER_ID,
        description: "Tentativa de invasao",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar accountId de outro usuario ao trocar de conta", async () => {
    const account = buildAccount();
    const otherUserAccount = buildAccount(OTHER_USER_ID);
    const transaction = buildTransaction({ accountId: account.id });
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const accountRepository = new FakeAccountRepository([
      account,
      otherUserAccount,
    ]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: transaction.id,
        userId: USER_ID,
        accountId: otherUserAccount.id,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar categoryId de outro usuario", async () => {
    const account = buildAccount();
    const otherUserCategory = buildCategory(OTHER_USER_ID);
    const transaction = buildTransaction({ accountId: account.id });
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository([
      otherUserCategory,
    ]);
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: transaction.id,
        userId: USER_ID,
        categoryId: otherUserCategory.id,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve permitir limpar categoryId (definir como null)", async () => {
    const account = buildAccount();
    const category = buildCategory();
    const transaction = new Transaction({
      date: new Date("2026-01-10T00:00:00.000Z"),
      description: "Mercado",
      type: "expense",
      amount: 150.5,
      accountId: account.id,
      categoryId: category.id,
      source: "manual",
      fingerprint: "abc123",
      userId: USER_ID,
    });
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    const updated = await useCase.execute({
      id: transaction.id,
      userId: USER_ID,
      categoryId: null,
    });

    expect(updated.categoryId).toBeNull();
  });

  it("nao deve recalcular fingerprint quando a transacao veio de import", async () => {
    const account = buildAccount();
    const transaction = new Transaction({
      date: new Date("2026-01-10T00:00:00.000Z"),
      description: "Mercado",
      type: "expense",
      amount: 150.5,
      accountId: account.id,
      source: "import",
      importId: "import-1",
      fingerprint: "hash-original",
      userId: USER_ID,
    });
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    const updated = await useCase.execute({
      id: transaction.id,
      userId: USER_ID,
      description: "Mercado atualizado",
    });

    expect(updated.fingerprint).toBe("hash-original");
  });

  it("deve rejeitar amount invalido com ValidationException", async () => {
    const account = buildAccount();
    const transaction = buildTransaction({ accountId: account.id });
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: transaction.id,
        userId: USER_ID,
        amount: -1,
      }),
    ).rejects.toThrow(ValidationException);
  });
});
