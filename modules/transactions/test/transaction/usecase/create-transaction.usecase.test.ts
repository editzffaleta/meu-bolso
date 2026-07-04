import { NotFoundError, ValidationException } from "@meubolso/shared";
import { Account } from "@meubolso/accounts";
import { Category } from "@meubolso/categories";
import { CreateTransaction } from "../../../src";
import {
  FakeAccountRepository,
  FakeCategoryRepository,
  FakeTransactionRepository,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";

function buildAccount(overrides: Partial<{ userId: string }> = {}): Account {
  return new Account({
    name: "Carteira",
    type: "wallet",
    initialBalance: 0,
    userId: overrides.userId ?? USER_ID,
  });
}

function buildCategory(overrides: Partial<{ userId: string }> = {}): Category {
  return new Category({
    name: "Mercado",
    type: "expense",
    color: "#059669",
    userId: overrides.userId ?? USER_ID,
    isDefault: false,
  });
}

describe("CreateTransaction", () => {
  it("deve criar e persistir a transacao no caminho feliz", async () => {
    const account = buildAccount();
    const category = buildCategory();
    const transactionRepository = new FakeTransactionRepository();
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new CreateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    const transaction = await useCase.execute({
      date: new Date("2026-01-10T00:00:00.000Z"),
      description: "Mercado",
      type: "expense",
      amount: 150.5,
      accountId: account.id,
      categoryId: category.id,
      userId: USER_ID,
    });

    expect(transaction.description).toBe("Mercado");
    expect(transaction.source).toBe("manual");
    expect(transaction.fingerprint).toBeDefined();
    expect(transactionRepository.transactions).toHaveLength(1);
  });

  it("deve criar a transacao sem categoryId (opcional)", async () => {
    const account = buildAccount();
    const transactionRepository = new FakeTransactionRepository();
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    const transaction = await useCase.execute({
      date: new Date("2026-01-10T00:00:00.000Z"),
      description: "Salario",
      type: "income",
      amount: 5000,
      accountId: account.id,
      userId: USER_ID,
    });

    expect(transaction.categoryId).toBeUndefined();
  });

  it("deve rejeitar accountId de outro usuario com NotFoundError, sem persistir", async () => {
    const otherUserAccount = buildAccount({ userId: OTHER_USER_ID });
    const transactionRepository = new FakeTransactionRepository();
    const accountRepository = new FakeAccountRepository([otherUserAccount]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        date: new Date("2026-01-10T00:00:00.000Z"),
        description: "Mercado",
        type: "expense",
        amount: 150.5,
        accountId: otherUserAccount.id,
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(transactionRepository.transactions).toHaveLength(0);
  });

  it("deve rejeitar categoryId de outro usuario com NotFoundError, sem persistir", async () => {
    const account = buildAccount();
    const otherUserCategory = buildCategory({ userId: OTHER_USER_ID });
    const transactionRepository = new FakeTransactionRepository();
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository([
      otherUserCategory,
    ]);
    const useCase = new CreateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        date: new Date("2026-01-10T00:00:00.000Z"),
        description: "Mercado",
        type: "expense",
        amount: 150.5,
        accountId: account.id,
        categoryId: otherUserCategory.id,
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);

    expect(transactionRepository.transactions).toHaveLength(0);
  });

  it("deve rejeitar amount <= 0 com ValidationException, sem persistir", async () => {
    const account = buildAccount();
    const transactionRepository = new FakeTransactionRepository();
    const accountRepository = new FakeAccountRepository([account]);
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateTransaction(
      transactionRepository,
      accountRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        date: new Date("2026-01-10T00:00:00.000Z"),
        description: "Mercado",
        type: "expense",
        amount: -10,
        accountId: account.id,
        userId: USER_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(transactionRepository.transactions).toHaveLength(0);
  });
});
